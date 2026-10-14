import { chapters, levelLabels, trackLabels, type Chapter, type Track } from "../chapters";
import { ChapterPage } from "./ChapterPage";
import { chapterStatus, href, statusLabel, useReadSet, useResults, useRoute, type ChapterStatus } from "./store";

export function App() {
  const route = useRoute();
  const results = useResults();
  const read = useReadSet();

  const statusOf = (c: Chapter): ChapterStatus => chapterStatus(c, results.results[c.id], read.has(c.id));

  return (
    <div className="layout">
      <Sidebar activeId={route.page === "chapter" ? route.id : null} statusOf={statusOf} />
      <main className="main">
        {route.page === "home" ? (
          <HomePage statusOf={statusOf} results={results} />
        ) : (
          <ChapterPage key={route.id} id={route.id} tab={route.tab} results={results} statusOf={statusOf} />
        )}
      </main>
    </div>
  );
}

function StatusDot({ status }: { status: ChapterStatus }) {
  return <span className={`dot dot-${status}`} aria-label={statusLabel[status]} title={statusLabel[status]} />;
}

function Sidebar({ activeId, statusOf }: { activeId: string | null; statusOf: (c: Chapter) => ChapterStatus }) {
  const tracks: Track[] = ["intro", "ts", "react"];
  const exercises = chapters.filter((c) => c.dir);
  const passed = exercises.filter((c) => statusOf(c) === "passed").length;

  return (
    <nav className="sidebar" aria-label="章の一覧">
      <a className="brand" href="#/">
        <span className="brand-mark">R</span>
        <span>
          <strong>TS / React</strong>
          <small>基礎ドリル</small>
        </span>
      </a>
      <div className="sidebar-progress">
        <div className="bar">
          <div className="bar-fill" style={{ width: `${(passed / exercises.length) * 100}%` }} />
        </div>
        <span>
          {passed} / {exercises.length} 合格
        </span>
      </div>
      {tracks.map((track) => (
        <div key={track} className="nav-group">
          <div className={`nav-track track-${track}`}>{trackLabels[track]}</div>
          <ul>
            {chapters
              .filter((c) => c.track === track)
              .map((c) => (
                <li key={c.id}>
                  <a href={href({ page: "chapter", id: c.id, tab: "lesson" })} className={c.id === activeId ? "active" : undefined}>
                    <StatusDot status={statusOf(c)} />
                    <span className="nav-no">{c.no}</span>
                    <span className="nav-title">{c.title}</span>
                  </a>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function HomePage({ statusOf, results }: { statusOf: (c: Chapter) => ChapterStatus; results: ReturnType<typeof useResults> }) {
  const runningAll = results.running.size > 1;
  const next = chapters.find((c) => statusOf(c) !== "passed");

  return (
    <div className="home">
      <header className="hero">
        <p className="eyebrow">AI に頼らず、手で書いて身につける</p>
        <h1>TypeScript / React 基礎ドリル</h1>
        <p className="lead">
          教科書を読んでインプットし、課題をエディタで解き、保存すると自動でテストが走ります。
          全章に合格し、各章の「面接で聞かれたら」に自分の言葉で答えられれば、基礎で困ることはありません。
        </p>
        {next && (
          <a className="btn btn-primary" href={href({ page: "chapter", id: next.id, tab: "lesson" })}>
            {next.id === "intro" ? "序章から始める" : `続きから: ${next.no} ${next.title}`} →
          </a>
        )}
      </header>

      <section className="flow">
        {[
          ["1", "教科書を読む", "章ごとの解説で、課題に必要な知識をインプット。コードは自分で打って試す"],
          ["2", "課題を解く", "エディタで exercise ファイルを編集。保存するとこの画面のテスト結果が更新される"],
          ["3", "答え合わせ", "全テスト合格で模範解答が開く。書き方の違いと「面接で聞かれたら」を確認"],
        ].map(([n, t, d]) => (
          <div key={n} className="flow-step">
            <span className="flow-no">{n}</span>
            <h3>{t}</h3>
            <p>{d}</p>
          </div>
        ))}
      </section>

      {(["ts", "react"] as const).map((track) => {
        const list = chapters.filter((c) => c.track === track);
        const passed = list.filter((c) => statusOf(c) === "passed").length;
        return (
          <section key={track} className="track-section">
            <div className="track-head">
              <h2 className={`track-title track-${track}`}>{trackLabels[track]}</h2>
              <span className="track-count">
                {passed} / {list.length} 合格
              </span>
            </div>
            <div className="cards">
              {list.map((c) => {
                const r = results.results[c.id];
                const status = statusOf(c);
                return (
                  <a key={c.id} className={`card card-${status}`} href={href({ page: "chapter", id: c.id, tab: "lesson" })}>
                    <div className="card-top">
                      <span className="card-no">{c.no}</span>
                      <span className={`level level-${c.level}`}>{levelLabels[c.level]}</span>
                    </div>
                    <h3>{c.title}</h3>
                    <p>{c.summary}</p>
                    <div className="card-foot">
                      <StatusDot status={status} />
                      <span>{statusLabel[status]}</span>
                      {r && (
                        <span className="card-score">
                          {r.passed}/{r.total}
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="home-actions">
        <button type="button" className="btn" disabled={runningAll} onClick={() => void results.run("all")}>
          {runningAll ? "全課題のテストを実行中…（30秒ほど）" : "全課題のテストを実行して進捗を更新"}
        </button>
        {results.error && <p className="error-text">{results.error}</p>}
      </section>
    </div>
  );
}
