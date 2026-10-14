/** 章の定義。サイト（ブラウザ）とテスト実行サーバーの両方から使う */

export type Track = "intro" | "ts" | "react";
export type Level = 1 | 2 | 3;

export interface Chapter {
  id: string; // "ts-01"
  track: Track;
  no: string; // "TS-01"
  title: string;
  level: Level;
  /** lessons/ 配下の教科書ファイル */
  lesson: string;
  /** exercises/ と solutions/ の下のディレクトリ（課題が無い章は undefined） */
  dir?: string;
  /** 課題ファイル名 */
  file?: string;
  summary: string;
}

export const chapters: Chapter[] = [
  {
    id: "intro",
    track: "intro",
    no: "序章",
    title: "このドリルの使い方と学び方",
    level: 1,
    lesson: "00-introduction.md",
    summary: "学習の進め方、テストの読み方、AI に頼らず手を動かすコツ",
  },

  // ---------------- TypeScript ----------------
  { id: "ts-01", track: "ts", no: "TS-01", title: "型の絞り込み（narrowing）", level: 1, lesson: "ts/01-narrowing.md", dir: "ts/01-narrowing", file: "exercise.ts", summary: "union 型 / typeof / Array.isArray / null チェック" },
  { id: "ts-02", track: "ts", no: "TS-02", title: "オブジェクト型とクロージャ", level: 1, lesson: "ts/02-objects.md", dir: "ts/02-objects", file: "exercise.ts", summary: "interface と type / optional / readonly / スプレッド / クロージャ" },
  { id: "ts-03", track: "ts", no: "TS-03", title: "配列メソッド", level: 1, lesson: "ts/03-array-methods.md", dir: "ts/03-array-methods", file: "exercise.ts", summary: "map / filter / reduce / sort と破壊的メソッド" },
  { id: "ts-04", track: "ts", no: "TS-04", title: "ジェネリクス", level: 1, lesson: "ts/04-generics.md", dir: "ts/04-generics", file: "exercise.ts", summary: "型引数と推論 / extends 制約 / keyof と T[K]" },
  { id: "ts-05", track: "ts", no: "TS-05", title: "判別可能なユニオン型", level: 1, lesson: "ts/05-discriminated-union.md", dir: "ts/05-discriminated-union", file: "exercise.ts", summary: "状態を型で設計する / never と網羅性チェック" },
  { id: "ts-06", track: "ts", no: "TS-06", title: "ユーティリティ型", level: 2, lesson: "ts/06-utility-types.md", dir: "ts/06-utility-types", file: "exercise.ts", summary: "Pick / Omit / Partial / Record / ReturnType / Awaited" },
  { id: "ts-07", track: "ts", no: "TS-07", title: "unknown と型ガード", level: 2, lesson: "ts/07-type-guards.md", dir: "ts/07-type-guards", file: "exercise.ts", summary: "外部データを安全に扱う / ユーザー定義型ガード" },
  { id: "ts-08", track: "ts", no: "TS-08", title: "非同期処理", level: 2, lesson: "ts/08-async.md", dir: "ts/08-async", file: "exercise.ts", summary: "Promise / async-await / 並列と直列 / イベントループ" },
  { id: "ts-09", track: "ts", no: "TS-09", title: "型レベルプログラミング", level: 3, lesson: "ts/09-type-level.md", dir: "ts/09-type-level", file: "exercise.ts", summary: "Mapped Types / Conditional Types / infer" },
  { id: "ts-10", track: "ts", no: "TS-10", title: "実践: よく出る実装問題", level: 3, lesson: "ts/10-practical.md", dir: "ts/10-practical", file: "exercise.ts", summary: "debounce / throttle / memoize / 型安全な EventEmitter" },

  // ---------------- React ----------------
  { id: "react-01", track: "react", no: "R-01", title: "コンポーネントと props", level: 1, lesson: "react/01-props-list.md", dir: "react/01-props-list", file: "exercise.tsx", summary: "JSX / props の型 / リストと key / 条件付きレンダリング" },
  { id: "react-02", track: "react", no: "R-02", title: "useState と再レンダー", level: 1, lesson: "react/02-use-state.md", dir: "react/02-use-state", file: "exercise.tsx", summary: "state はスナップショット / 関数型アップデート" },
  { id: "react-03", track: "react", no: "R-03", title: "フォームと制御コンポーネント", level: 1, lesson: "react/03-controlled-form.md", dir: "react/03-controlled-form", file: "exercise.tsx", summary: "value と onChange / onSubmit / バリデーション / label" },
  { id: "react-04", track: "react", no: "R-04", title: "配列 state と派生データ", level: 1, lesson: "react/04-todo.md", dir: "react/04-todo", file: "exercise.tsx", summary: "イミュータブルな追加・更新・削除 / 計算で出せる値は state にしない" },
  { id: "react-05", track: "react", no: "R-05", title: "useEffect とデータ取得", level: 2, lesson: "react/05-use-effect-fetch.md", dir: "react/05-use-effect-fetch", file: "exercise.tsx", summary: "依存配列 / クリーンアップ / 競合状態 / AbortController" },
  { id: "react-06", track: "react", no: "R-06", title: "カスタムフック", level: 2, lesson: "react/06-custom-hooks.md", dir: "react/06-custom-hooks", file: "exercise.ts", summary: "ロジックの切り出し / フックのルール / 遅延初期化" },
  { id: "react-07", track: "react", no: "R-07", title: "useReducer", level: 2, lesson: "react/07-use-reducer.md", dir: "react/07-use-reducer", file: "exercise.tsx", summary: "Action の型設計 / 純粋な reducer / selector" },
  { id: "react-08", track: "react", no: "R-08", title: "Context", level: 3, lesson: "react/08-context.md", dir: "react/08-context", file: "exercise.tsx", summary: "prop drilling の解消 / Provider / value のメモ化" },
  { id: "react-09", track: "react", no: "R-09", title: "再レンダーの最適化", level: 3, lesson: "react/09-memo.md", dir: "react/09-memo", file: "exercise.tsx", summary: "React.memo / useCallback / useMemo / いつ使うべきか" },
  { id: "react-10", track: "react", no: "R-10", title: "総合: インクリメンタルサーチ", level: 3, lesson: "react/10-search-app.md", dir: "react/10-search-app", file: "exercise.tsx", summary: "これまでの全部を組み合わせて1画面を作る" },
];

export const trackLabels: Record<Track, string> = {
  intro: "はじめに",
  ts: "TypeScript",
  react: "React",
};

export const levelLabels: Record<Level, string> = { 1: "基礎", 2: "中級", 3: "応用" };

/** API の型 */
export interface TestCase {
  name: string;
  group: string;
  kind: "runtime" | "type";
  status: "passed" | "failed" | "skipped";
  message?: string;
}

export interface ChapterResult {
  chapterId: string;
  passed: number;
  total: number;
  ranAt: string;
  durationMs: number;
  tests: TestCase[];
  /** テスト実行自体が失敗したとき（構文エラーなど） */
  error?: string;
}

export type ResultsMap = Record<string, ChapterResult>;

export interface SourceFile {
  name: string;
  path: string; // リポジトリルートからの相対パス
  absPath: string;
  content: string;
}
