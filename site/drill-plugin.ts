/**
 * 学習サイト用の Vite プラグイン（ローカル専用のミニ API サーバー）
 *
 * - GET  /api/results          保存済みのテスト結果
 * - GET  /api/source?id=&kind= 課題 / 模範解答 / テストのソース
 * - POST /api/run?id=          指定した章（id=all で全章）のテストを実行
 * - exercises/ のファイルが保存されたら、その章のテストを自動実行して WebSocket で通知
 */
import type { Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chapters, type ChapterResult, type ResultsMap, type SourceFile, type TestCase } from "./chapters";

const root = path.resolve(import.meta.dirname, "..");
const storeDir = path.join(root, ".study");
const storeFile = path.join(storeDir, "results.json");

function loadResults(): ResultsMap {
  try {
    return JSON.parse(fs.readFileSync(storeFile, "utf8")) as ResultsMap;
  } catch {
    return {};
  }
}

function saveResults(results: ResultsMap) {
  fs.mkdirSync(storeDir, { recursive: true });
  fs.writeFileSync(storeFile, JSON.stringify(results, null, 2));
}

const stripAnsi = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, "");

/** 失敗メッセージから node_modules のスタックなどを落として読みやすくする */
function cleanMessage(raw: string): string {
  const lines = stripAnsi(raw)
    .split("\n")
    .filter((l) => !/node_modules|node:internal|^\s*at (async )?(processTicksAndRejections|runTest|new Promise)/.test(l))
    .map((l) => l.replaceAll(root + path.sep, ""));
  return lines.slice(0, 30).join("\n").trim();
}

interface VitestJson {
  testResults: {
    name: string;
    status: string;
    message?: string;
    startTime?: number;
    endTime?: number;
    assertionResults: {
      ancestorTitles: string[];
      title: string;
      status: string;
      failureMessages?: string[];
    }[];
  }[];
}

function runVitest(filters: string[]): Promise<VitestJson> {
  const out = path.join(os.tmpdir(), `drill-${process.pid}-${Date.now()}.json`);
  const args = [
    path.join(root, "node_modules/vitest/vitest.mjs"),
    "run",
    "--typecheck",
    "--reporter=json",
    `--outputFile=${out}`,
    ...filters,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, FORCE_COLOR: "0" } });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.stdout.on("data", () => {});
    child.on("close", () => {
      try {
        const json = JSON.parse(fs.readFileSync(out, "utf8")) as VitestJson;
        fs.rmSync(out, { force: true });
        resolve(json);
      } catch {
        reject(new Error(cleanMessage(stderr) || "テストを実行できませんでした"));
      }
    });
  });
}

async function runChapters(ids: string[]): Promise<ResultsMap> {
  const targets = chapters.filter((c) => c.dir && ids.includes(c.id));
  const started = Date.now();
  const filters = targets.map((c) => `exercises/${c.dir}/`);
  const results: ResultsMap = {};

  let json: VitestJson | undefined;
  let error: string | undefined;
  try {
    json = await runVitest(filters);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  for (const c of targets) {
    const files = json?.testResults.filter((f) => f.name.includes(`${path.sep}exercises${path.sep}${c.dir!.replace("/", path.sep)}${path.sep}`)) ?? [];
    const tests: TestCase[] = files.flatMap((f) =>
      f.assertionResults.map((a) => ({
        name: a.title,
        group: a.ancestorTitles.filter((t) => !t.includes("/")).join(" > "),
        kind: f.name.includes(".test-d.") ? ("type" as const) : ("runtime" as const),
        status: a.status === "passed" ? ("passed" as const) : a.status === "failed" ? ("failed" as const) : ("skipped" as const),
        message: a.failureMessages?.length ? cleanMessage(a.failureMessages.join("\n")) : undefined,
      })),
    );
    // ファイル単位のエラー（構文エラー・import 失敗など）
    const fileErrors = files.filter((f) => f.message && f.assertionResults.length === 0).map((f) => cleanMessage(f.message!));
    results[c.id] = {
      chapterId: c.id,
      passed: tests.filter((t) => t.status === "passed").length,
      total: tests.length,
      ranAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      tests,
      error: error ?? (fileErrors.length ? fileErrors.join("\n\n") : undefined),
    };
  }
  return results;
}

function readSource(rel: string): SourceFile | null {
  const abs = path.join(root, rel);
  if (!abs.startsWith(root) || !fs.existsSync(abs)) return null;
  return { name: path.basename(rel), path: rel, absPath: abs, content: fs.readFileSync(abs, "utf8") };
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function drillPlugin(): Plugin {
  let results = loadResults();
  // 同時に複数の vitest を走らせないよう直列化する
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(job: () => Promise<T>): Promise<T> => {
    const p = queue.then(job, job);
    queue = p.catch(() => {});
    return p;
  };

  const run = (server: ViteDevServer, ids: string[]) =>
    enqueue(async () => {
      server.ws.send({ type: "custom", event: "drill:running", data: { ids } });
      const fresh = await runChapters(ids);
      results = { ...results, ...fresh };
      saveResults(results);
      server.ws.send({ type: "custom", event: "drill:results", data: fresh });
      return fresh;
    });

  return {
    name: "drill-api",
    configureServer(server) {
      // exercises/ の保存を監視して自動実行
      const exercisesDir = path.join(root, "exercises");
      server.watcher.add(exercisesDir);
      const timers = new Map<string, ReturnType<typeof setTimeout>>();
      server.watcher.on("change", (file) => {
        if (!file.startsWith(exercisesDir + path.sep) || /\.test(-d)?\.tsx?$/.test(file)) return;
        const rel = path.relative(exercisesDir, file).split(path.sep).join("/");
        const chapter = chapters.find((c) => c.dir && rel.startsWith(c.dir + "/"));
        if (!chapter) return;
        clearTimeout(timers.get(chapter.id));
        timers.set(
          chapter.id,
          setTimeout(() => void run(server, [chapter.id]), 300),
        );
      });

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        try {
          if (url.pathname === "/api/results" && req.method === "GET") {
            return sendJson(res, 200, results);
          }

          if (url.pathname === "/api/source" && req.method === "GET") {
            const chapter = chapters.find((c) => c.id === url.searchParams.get("id"));
            const kind = url.searchParams.get("kind");
            if (!chapter?.dir || !chapter.file) return sendJson(res, 404, { error: "not found" });
            const base = kind === "solution" ? "solutions" : "exercises";
            if (kind === "tests") {
              const dir = path.join(root, "exercises", chapter.dir);
              const files = fs
                .readdirSync(dir)
                .filter((f) => /\.test(-d)?\.tsx?$/.test(f))
                .map((f) => readSource(`exercises/${chapter.dir}/${f}`))
                .filter((f): f is SourceFile => f !== null);
              return sendJson(res, 200, files);
            }
            const file = readSource(`${base}/${chapter.dir}/${chapter.file}`);
            return file ? sendJson(res, 200, [file]) : sendJson(res, 404, { error: "not found" });
          }

          if (url.pathname === "/api/run" && req.method === "POST") {
            const id = url.searchParams.get("id");
            const ids = id === "all" ? chapters.filter((c) => c.dir).map((c) => c.id) : chapters.filter((c) => c.id === id && c.dir).map((c) => c.id);
            if (ids.length === 0) return sendJson(res, 404, { error: "not found" });
            return sendJson(res, 200, await run(server, ids));
          }

          return sendJson(res, 404, { error: "not found" });
        } catch (e) {
          return sendJson(res, 500, { error: e instanceof Error ? e.message : String(e) });
        }
      });
    },
  };
}
