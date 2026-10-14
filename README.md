# TypeScript / React 基礎ドリル

AI 補完に頼らず手で書いて、**テストが通れば合格**という形式の課題集です。
TypeScript 10 問・React 10 問。全部自力で解けて、各課題の「面接で聞かれること」を口頭で説明できれば、
実務経験者の技術面接で基礎を問われて困ることはまずありません。

## はじめ方

```bash
npm install
npm test            # ウォッチモード。保存するたびに再実行される
npm run ui          # ブラウザで課題ごとの合否を一覧表示（おすすめ）
```

1課題だけ回したいときはパスで絞り込みます。

```bash
npm test ts/01      # TS-01 だけ
npm test react/05   # R-05 だけ
```

最初は全部赤（失敗）です。`exercises/` の中の `exercise.ts(x)` を編集して緑にしていきます。

## ルール（効果を出すために）

- **エディタの AI 補完（Copilot 等）はオフにする。** VS Code なら `"github.copilot.enable": { "*": false }`
- 調べてよいのは MDN / TypeScript Handbook / react.dev の公式ドキュメントだけ
- テストファイル（`*.test.ts(x)` / `*.test-d.ts`）は読んでよいが、書き換えない
- 各ファイル冒頭の【ルール】を守る（`any` 禁止など）。テストが通っても、ルール違反なら不合格扱い
- 解けたら `solutions/` の模範解答と見比べて、書き方の差を確認する
- 最後に「面接で聞かれること」に声に出して答える。詰まったら理解が浅いサイン

## 課題一覧

★ = 基礎（ここまでは必須）　★★ = 中級（実務で毎日使う）　★★★ = 応用（面接で差がつく）

### TypeScript

| # | テーマ | 難易度 | 主な内容 |
|---|--------|:---:|---|
| [TS-01](exercises/ts/01-narrowing/exercise.ts) | 型の絞り込み | ★ | union / typeof / Array.isArray / `== null` |
| [TS-02](exercises/ts/02-objects/exercise.ts) | オブジェクトとクロージャ | ★ | interface / optional / readonly / イミュータブル更新 / クロージャ |
| [TS-03](exercises/ts/03-array-methods/exercise.ts) | 配列メソッド | ★ | map / filter / reduce / sort の破壊性 / groupBy を自作 |
| [TS-04](exercises/ts/04-generics/exercise.ts) | ジェネリクス | ★ | 型引数の推論 / `K extends keyof T` / `T[K]` |
| [TS-05](exercises/ts/05-discriminated-union/exercise.ts) | 判別可能なユニオン | ★ | 状態の型設計 / never による網羅性チェック |
| [TS-06](exercises/ts/06-utility-types/exercise.ts) | ユーティリティ型 | ★★ | Pick / Omit / Partial / Record / ReturnType / Awaited … |
| [TS-07](exercises/ts/07-type-guards/exercise.ts) | unknown と型ガード | ★★ | `value is T` / JSON.parse / catch したエラーの扱い |
| [TS-08](exercises/ts/08-async/exercise.ts) | 非同期処理 | ★★ | Promise.all / allSettled / race / retry / 直列と並列 |
| [TS-09](exercises/ts/09-type-level/exercise.ts) | 型レベルプログラミング | ★★★ | Mapped Types / Conditional Types / infer / Key Remapping |
| [TS-10](exercises/ts/10-practical/exercise.ts) | 実践実装 | ★★★ | debounce / throttle / memoize / 型安全な EventEmitter |

### React

| # | テーマ | 難易度 | 主な内容 |
|---|--------|:---:|---|
| [R-01](exercises/react/01-props-list/exercise.tsx) | props とリスト | ★ | props の型 / key / 条件付きレンダリング / イベント |
| [R-02](exercises/react/02-use-state/exercise.tsx) | useState | ★ | state のスナップショット / 関数型アップデート |
| [R-03](exercises/react/03-controlled-form/exercise.tsx) | フォーム | ★ | 制御コンポーネント / バリデーション / label と a11y |
| [R-04](exercises/react/04-todo/exercise.tsx) | Todo アプリ | ★ | 配列 state の追加・更新・削除 / 派生データを state にしない |
| [R-05](exercises/react/05-use-effect-fetch/exercise.tsx) | useEffect とデータ取得 | ★★ | 依存配列 / クリーンアップ / AbortController / 競合状態 |
| [R-06](exercises/react/06-custom-hooks/exercise.ts) | カスタムフック | ★★ | useToggle / useDebouncedValue / useLocalStorage |
| [R-07](exercises/react/07-use-reducer/exercise.tsx) | useReducer | ★★ | 型付き Action / 純粋な reducer / selector |
| [R-08](exercises/react/08-context/exercise.tsx) | Context | ★★★ | 認証状態の共有 / Provider 外での利用検出 / value のメモ化 |
| [R-09](exercises/react/09-memo/exercise.tsx) | 再レンダー最適化 | ★★★ | React.memo / useCallback / useMemo（レンダー回数で判定） |
| [R-10](exercises/react/10-search-app/exercise.tsx) | 総合: インクリメンタルサーチ | ★★★ | debounce + fetch + abort + 状態設計（ライブコーディング想定） |

おすすめの順番: TS-01〜05 → R-01〜04 → TS-06〜08 → R-05〜07 → TS-09〜10 → R-08〜10

## テストの仕組み

- `*.test.ts(x)` … 実行時の動作をテスト（Vitest + Testing Library）
- `*.test-d.ts` … **型**をテスト。`expectTypeOf` と `// @ts-expect-error` で「この呼び出しはコンパイルエラーになるべき」も検証している。
  型の課題で `any` を使うと、ここが落ちる
- `npm run solutions` … 模範解答が全テストを通ることの確認用

## 全部解けたら

- 時間を計って R-10 をゼロから書き直す（目安 30〜40 分）
- R-04 の Todo を「R-07 の useReducer」「R-06 の useLocalStorage」で書き直す
- R-05 を TanStack Query で書き直し、自前実装と比べて何が楽になったか説明できるようにする
- 自分のポートフォリオのコードを読み返し、ここで学んだ観点（派生 state、effect のクリーンアップ、型の導出）で直せる箇所を探す
