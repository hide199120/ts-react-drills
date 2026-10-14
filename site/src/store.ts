import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { chapters, type Chapter, type ChapterResult, type ResultsMap } from "../chapters";

// ---------------- ルーティング（ハッシュ） ----------------

export type Tab = "lesson" | "exercise" | "solution";
export type Route = { page: "home" } | { page: "chapter"; id: string; tab: Tab };

function parseHash(): Route {
  const [, page, id, tab] = location.hash.replace(/^#/, "").split("/");
  if (page === "ch" && id && chapters.some((c) => c.id === id)) {
    const t: Tab = tab === "exercise" || tab === "solution" ? tab : "lesson";
    return { page: "chapter", id, tab: t };
  }
  return { page: "home" };
}

let currentRoute = parseHash();
const routeListeners = new Set<() => void>();
window.addEventListener("hashchange", () => {
  currentRoute = parseHash();
  routeListeners.forEach((l) => l());
  window.scrollTo({ top: 0 });
});

export function useRoute(): Route {
  return useSyncExternalStore(
    (l) => {
      routeListeners.add(l);
      return () => routeListeners.delete(l);
    },
    () => currentRoute,
  );
}

export const href = (r: Route) => (r.page === "home" ? "#/" : `#/ch/${r.id}/${r.tab}`);

// ---------------- 読了フラグ（localStorage） ----------------

const READ_KEY = "drill:read";
let readSet: ReadonlySet<string> = (() => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]"));
  } catch {
    return new Set<string>();
  }
})();
const readListeners = new Set<() => void>();

export function setRead(id: string, read: boolean) {
  const next = new Set(readSet);
  if (read) next.add(id);
  else next.delete(id);
  readSet = next;
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...next]));
  } catch {
    /* 保存できなくても動作は続ける */
  }
  readListeners.forEach((l) => l());
}

export function useReadSet(): ReadonlySet<string> {
  return useSyncExternalStore(
    (l) => {
      readListeners.add(l);
      return () => readListeners.delete(l);
    },
    () => readSet,
  );
}

// ---------------- テスト結果（サーバー） ----------------

export function useResults() {
  const [results, setResults] = useState<ResultsMap>({});
  const [running, setRunning] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json() as Promise<ResultsMap>)
      .then(setResults)
      .catch(() => setError("テスト結果を読み込めませんでした。npm run study で起動しているか確認してください"));

    const hot = import.meta.hot;
    if (!hot) return;
    const onRunning = (data: { ids: string[] }) => setRunning((prev) => new Set([...prev, ...data.ids]));
    const onResults = (data: ResultsMap) => {
      setResults((prev) => ({ ...prev, ...data }));
      setRunning((prev) => {
        const next = new Set(prev);
        Object.keys(data).forEach((id) => next.delete(id));
        return next;
      });
    };
    hot.on("drill:running", onRunning);
    hot.on("drill:results", onResults);
    return () => {
      hot.off("drill:running", onRunning);
      hot.off("drill:results", onResults);
    };
  }, []);

  const run = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/run?id=${encodeURIComponent(id)}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "テストの実行に失敗しました");
    }
  }, []);

  return { results, running, error, run };
}

export type ChapterStatus = "passed" | "trying" | "read" | "new";

export function chapterStatus(c: Chapter, result: ChapterResult | undefined, read: boolean): ChapterStatus {
  if (!c.dir) return read ? "passed" : "new";
  if (result && result.total > 0 && result.passed === result.total && !result.error) return "passed";
  // 未着手の雛形でも通るテストが少しあるので、「読了済みで1つ以上通った」を挑戦中とする
  if (read && result && result.passed > 0) return "trying";
  return read ? "read" : "new";
}

export const statusLabel: Record<ChapterStatus, string> = {
  passed: "合格",
  trying: "挑戦中",
  read: "読了",
  new: "未着手",
};
