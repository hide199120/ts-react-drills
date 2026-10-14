/**
 * R-10 模範解答
 *
 * ポイント
 * - 「入力欄の値（text）」と「検索に使う値（query = debounce 後）」を分ける
 *   → 入力は即座に反映（制御コンポーネント）、検索は落ち着いてから
 * - 検索の effect は query だけに依存。query が変わるとクリーンアップで前のリクエストを abort
 * - 状態は判別可能なユニオン。表示は switch で状態ごとに分岐
 * - クリア: debounce 中のタイマーは text が "" に変わった時点で張り直されるので、古い入力では検索されない。
 *   ただし query 自体は 300ms 後まで古いままなので、表示は text が空なら出さないようにしておく
 */
import { useEffect, useId, useState } from "react";

export interface SearchUser {
  id: number;
  name: string;
  department: string;
}

export interface UserSearchProps {
  searchUsers: (query: string, signal: AbortSignal) => Promise<SearchUser[]>;
}

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; users: SearchUser[] }
  | { status: "error" };

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function UserSearch({ searchUsers }: UserSearchProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const query = useDebouncedValue(text.trim(), 300);
  const id = useId();

  useEffect(() => {
    if (!query) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    setState({ status: "loading" });
    searchUsers(query, controller.signal)
      .then((users) => {
        if (!controller.signal.aborted) setState({ status: "success", users });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [query, searchUsers]);

  const handleClear = () => {
    setText("");
    setState({ status: "idle" });
  };

  const renderResult = () => {
    if (!text.trim()) return null;
    switch (state.status) {
      case "idle":
        return null;
      case "loading":
        return <p>検索中...</p>;
      case "error":
        return <p role="alert">検索に失敗しました</p>;
      case "success":
        if (state.users.length === 0) return <p>該当するユーザーはいません</p>;
        return (
          <>
            <p>{state.users.length}件</p>
            <ul>
              {state.users.map((u) => (
                <li key={u.id}>
                  {u.name}（{u.department}）
                </li>
              ))}
            </ul>
          </>
        );
    }
  };

  return (
    <div>
      <label htmlFor={id}>検索</label>
      <input id={id} type="search" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" onClick={handleClear} disabled={text === ""}>
        クリア
      </button>
      <div aria-live="polite">{renderResult()}</div>
    </div>
  );
}
