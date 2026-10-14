import { useEffect, useMemo, useState, type ReactNode } from "react";
import { chapters, levelLabels, trackLabels, type Chapter, type ChapterResult, type SourceFile, type TestCase } from "../chapters";
import { highlight, renderMarkdown } from "./markdown";
import { href, setRead, statusLabel, useReadSet, type ChapterStatus, type Tab, type useResults } from "./store";

const lessons = import.meta.glob("../../lessons/**/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

interface Props {
  id: string;
  tab: Tab;
  results: ReturnType<typeof useResults>;
  statusOf: (c: Chapter) => ChapterStatus;
}

export function ChapterPage({ id, tab, results, statusOf }: Props) {
  const index = chapters.findIndex((c) => c.id === id);
  const chapter = chapters[index]!;
  const prev = chapters[index - 1];
  const next = chapters[index + 1];
  const result = results.results[id];
  const status = statusOf(chapter);
  const hasExercise = Boolean(chapter.dir);

  const tabs: { key: Tab; label: string }[] = hasExercise
    ? [
        { key: "lesson", label: "📖 教科書" },
        { key: "exercise", label: "✍️ 課題とテスト" },
        { key: "solution", label: "💡 模範解答" },
      ]
    : [{ key: "lesson", label: "📖 教科書" }];

  return (
    <article className="chapter">
      <header className="chapter-head">
        <div className="crumbs">
          <span className={`track-pill track-${chapter.track}`}>{trackLabels[chapter.track]}</span>
          <span>{chapter.no}</span>
          {hasExercise && <span className={`level level-${chapter.level}`}>{levelLabels[chapter.level]}</span>}
          {hasExercise && <span className={`status-pill status-${status}`}>{statusLabel[status]}</span>}
        </div>
        <h1>{chapter.title}</h1>
        <p className="chapter-summary">{chapter.summary}</p>
        {tabs.length > 1 && (
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <a key={t.key} role="tab" aria-selected={tab === t.key} className="tab" href={href({ page: "chapter", id, tab: t.key })}>
                {t.label}
                {t.key === "exercise" && result && (
                  <span className={`tab-score ${result.passed === result.total && result.total > 0 ? "ok" : ""}`}>
                    {result.passed}/{result.total}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </header>

      {tab === "lesson" && <LessonTab chapter={chapter} next={next} />}
      {tab === "exercise" && hasExercise && <ExerciseTab chapter={chapter} result={result} results={results} />}
      {tab === "solution" && hasExercise && <SolutionTab chapter={chapter} passed={status === "passed"} />}

      <footer className="pager">
        {prev ? (
          <a href={href({ page: "chapter", id: prev.id, tab: "lesson" })}>
            <small>← 前の章</small>
            {prev.no} {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="pager-next" href={href({ page: "chapter", id: next.id, tab: "lesson" })}>
            <small>次の章 →</small>
            {next.no} {next.title}
          </a>
        )}
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------- 教科書

function LessonTab({ chapter, next }: { chapter: Chapter; next?: Chapter }) {
  const source = lessons[`../../lessons/${chapter.lesson}`];
  const { html, headings } = useMemo(() => renderMarkdown(source ?? "# 準備中\n\nこの章の教科書はまだありません。"), [source]);
  const read = useReadSet().has(chapter.id);

  const finish = () => {
    setRead(chapter.id, true);
    location.hash = chapter.dir ? href({ page: "chapter", id: chapter.id, tab: "exercise" }) : next ? href({ page: "chapter", id: next.id, tab: "lesson" }) : "#/";
  };

  return (
    <div className="lesson-layout">
      <div className="lesson">
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="lesson-finish">
          <p>{read ? "この章は読了済みです。" : "読み終えたら、手を動かして確かめましょう。"}</p>
          <button type="button" className="btn btn-primary" onClick={finish}>
            {chapter.dir ? "読み終えた → 課題に進む" : `読み終えた → ${next?.no ?? "ホーム"}へ`}
          </button>
          {read && (
            <button type="button" className="btn btn-ghost" onClick={() => setRead(chapter.id, false)}>
              未読に戻す
            </button>
          )}
        </div>
      </div>
      {headings.length > 2 && (
        <aside className="toc" aria-label="この章の内容">
          <p>この章の内容</p>
          <ol>
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 課題

function useSource(chapterId: string, kind: "exercise" | "solution" | "tests", refreshKey?: string) {
  const [files, setFiles] = useState<SourceFile[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/source?id=${chapterId}&kind=${kind}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<SourceFile[]>)
      .then(setFiles)
      .catch(() => {});
    return () => controller.abort();
  }, [chapterId, kind, refreshKey]);
  return files;
}

/** 先頭の JSDoc を問題文として取り出す */
function splitDocblock(content: string): { doc: string[]; code: string } {
  const m = content.match(/^\s*\/\*\*([\s\S]*?)\*\/\s*/);
  if (!m) return { doc: [], code: content };
  const doc = m[1]!.split("\n").map((l) => l.replace(/^\s*\* ?/, ""));
  while (doc.length && !doc[0]!.trim()) doc.shift();
  while (doc.length && !doc.at(-1)!.trim()) doc.pop();
  return { doc, code: content.slice(m[0].length) };
}

function ProblemStatement({ lines }: { lines: string[] }) {
  const blocks: ReactNode[] = [];
  lines.forEach((line, i) => {
    // 見出し直前の空行は余白が重なるので詰める
    if (!line.trim() && lines[i + 1]?.startsWith("【")) return;
    const heading = line.match(/^【(.+?)】\s*(.*)$/);
    if (heading) {
      blocks.push(
        <h4 key={i} className={heading[1]!.includes("面接") ? "is-interview" : undefined}>
          {heading[1]}
        </h4>,
      );
      if (heading[2]) blocks.push(<p key={`${i}-t`}>{heading[2]}</p>);
    } else if (i === 0) {
      blocks.push(
        <p key={i} className="problem-title">
          {line}
        </p>,
      );
    } else {
      blocks.push(<p key={i}>{line || " "}</p>);
    }
  });
  return <div className="problem">{blocks}</div>;
}

function Code({ code, lang = "typescript" }: { code: string; lang?: string }) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);
  return (
    <div className="code-block">
      <pre>
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

function FileBar({ file }: { file: SourceFile }) {
  const [copied, setCopied] = useState(false);
  const open = () => {
    fetch(`/__open-in-editor?file=${encodeURIComponent(file.absPath)}`).catch(() => {
      location.href = `vscode://file/${file.absPath}`;
    });
  };
  const copy = async () => {
    await navigator.clipboard.writeText(file.absPath);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="filebar">
      <code>{file.path}</code>
      <div className="filebar-actions">
        <button type="button" className="btn btn-small" onClick={open}>
          エディタで開く
        </button>
        <a className="btn btn-small btn-ghost" href={`vscode://file/${file.absPath}`}>
          VS Code
        </a>
        <button type="button" className="btn btn-small btn-ghost" onClick={() => void copy()}>
          {copied ? "コピーしました" : "パスをコピー"}
        </button>
      </div>
    </div>
  );
}

function ExerciseTab({ chapter, result, results }: { chapter: Chapter; result?: ChapterResult; results: ReturnType<typeof useResults> }) {
  const files = useSource(chapter.id, "exercise", result?.ranAt);
  const tests = useSource(chapter.id, "tests");
  const file = files?.[0];
  const { doc } = useMemo(() => splitDocblock(file?.content ?? ""), [file]);
  const running = results.running.has(chapter.id);
  const allPassed = Boolean(result && result.total > 0 && result.passed === result.total && !result.error);

  return (
    <div className="exercise">
      <section className="panel">
        <h2 className="panel-title">課題</h2>
        {file ? <ProblemStatement lines={doc} /> : <p className="muted">読み込み中…</p>}
        {file && <FileBar file={file} />}
        <p className="hint">
          このファイルをエディタで編集して保存すると、下のテストが自動で実行されます。
          <br />
          ターミナル派なら <code>npm test {chapter.dir}</code> でも同じテストが動きます。
        </p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">
            テスト結果
            {result && (
              <span className={`score ${allPassed ? "ok" : ""}`}>
                {result.passed} / {result.total} 合格
              </span>
            )}
          </h2>
          <button type="button" className="btn btn-primary btn-small" disabled={running} onClick={() => void results.run(chapter.id)}>
            {running ? "実行中…" : "テストを実行"}
          </button>
        </div>

        {running && <div className="running-bar" />}
        {results.error && <p className="error-text">{results.error}</p>}

        {allPassed && (
          <div className="celebrate">
            <strong>🎉 全テスト合格！</strong>
            <p>
              模範解答と見比べて、書き方の違いを確認しましょう。その後、課題文の「面接で聞かれること」に声に出して答えてみてください。
            </p>
            <a className="btn btn-small" href={href({ page: "chapter", id: chapter.id, tab: "solution" })}>
              模範解答を見る →
            </a>
          </div>
        )}

        {!result && !running && <p className="muted">まだ実行していません。「テストを実行」を押すか、課題ファイルを保存してください。</p>}
        {result?.error && (
          <div className="test-error">
            <strong>テストを実行できませんでした（構文エラーや import の失敗など）</strong>
            <pre>{result.error}</pre>
          </div>
        )}
        {result && <TestList tests={result.tests} />}
        {result && <p className="muted small">最終実行: {new Date(result.ranAt).toLocaleTimeString("ja-JP")}</p>}
      </section>

      {tests && tests.length > 0 && (
        <details className="panel test-source">
          <summary>テストコードを見る（何を検証しているかの確認に。書き換えないこと）</summary>
          {tests.map((t) => (
            <div key={t.path}>
              <p className="file-label">{t.name}</p>
              <Code code={t.content} />
            </div>
          ))}
        </details>
      )}
    </div>
  );
}

function TestList({ tests }: { tests: TestCase[] }) {
  const groups: { title: string; kind: TestCase["kind"]; items: TestCase[] }[] = [
    { title: "動作のテスト", kind: "runtime", items: tests.filter((t) => t.kind === "runtime") },
    { title: "型のテスト（コンパイル時にチェック）", kind: "type", items: tests.filter((t) => t.kind === "type") },
  ];
  return (
    <div className="test-groups">
      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <div key={g.kind}>
            <h3 className="test-group-title">{g.title}</h3>
            <ul className="tests">
              {g.items.map((t, i) => (
                <li key={`${t.group}-${t.name}-${i}`} className={`test test-${t.status}`}>
                  <div className="test-row">
                    <span className="test-icon" aria-hidden>
                      {t.status === "passed" ? "✓" : t.status === "failed" ? "✕" : "–"}
                    </span>
                    <span>{t.name}</span>
                  </div>
                  {t.status === "failed" && t.message && (
                    <details className="test-message">
                      <summary>失敗の詳細</summary>
                      <pre>{t.message}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------- 模範解答

function SolutionTab({ chapter, passed }: { chapter: Chapter; passed: boolean }) {
  const [revealed, setRevealed] = useState(passed);
  const files = useSource(chapter.id, "solution");
  const file = files?.[0];
  const { doc, code } = useMemo(() => splitDocblock(file?.content ?? ""), [file]);

  if (!revealed) {
    return (
      <div className="panel gate">
        <h2>まだテストに合格していません</h2>
        <p>
          答えを先に見ると、解けた気になって力がつきません。教科書を読み返したり、テストの失敗メッセージを読んだりして、
          あと15分だけ粘ってみましょう。
        </p>
        <div className="gate-actions">
          <a className="btn btn-primary" href={href({ page: "chapter", id: chapter.id, tab: "lesson" })}>
            教科書を読み返す
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => setRevealed(true)}>
            それでも答えを見る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {file ? (
        <>
          <div className="solution-notes">
            {doc.slice(1).map((line, i) => (
              <p key={i} className={line.startsWith("- ") ? "bullet" : undefined}>
                {line.replace(/^- /, "") || " "}
              </p>
            ))}
          </div>
          <p className="file-label">{file.path}</p>
          <Code code={code} />
        </>
      ) : (
        <p className="muted">読み込み中…</p>
      )}
    </div>
  );
}
