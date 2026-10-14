# Context

## この章で学ぶこと

- props のバケツリレー（prop drilling）の問題
- `createContext` / Provider / `useContext` の使い方
- Provider の外での利用を検出するカスタムフックのパターン
- Context の値が変わったときの再レンダー
- `value` を `useMemo` / `useCallback` でメモ化する理由
- 非同期のログイン処理と `try / finally`
- Context と状態管理ライブラリの使い分け

## props のバケツリレー

ログイン中のユーザー情報を、ヘッダーのアイコンと、深い場所にあるコメント欄で使いたいとします。

```text
App（user を持つ）
└── Layout          ← user を受け取って下に渡すだけ
    ├── Header      ← user を使う
    └── Main        ← user を受け取って下に渡すだけ
        └── Article ← user を受け取って下に渡すだけ
            └── CommentForm ← user を使う
```

R-04 の「共通の親に state を置く」ルールに従うと App に置くことになりますが、**途中のコンポーネントは自分では使わないのに、props を受け取って下に渡すだけ**になります。これを **prop drilling（props のバケツリレー）** と呼びます。

- 途中のコンポーネントが、関係ない props を知る必要がある
- props を1つ増やすと、経路上のすべてのコンポーネントを修正する必要がある

## Context の基本

Context は、**ツリーの上で値を提供し、下のどこからでも直接受け取れる**仕組みです。

```tsx
import { createContext, useContext, useState } from "react";

// 1. Context を作る（引数はデフォルト値）
const ThemeContext = createContext<"light" | "dark">("light");

// 2. Provider で値を提供する
function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. 下のどこからでも useContext で受け取る（途中の Layout は何も知らなくていい）
function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>OK</button>;
}
```

- `useContext` は、**ツリーを上にたどって一番近い Provider の value** を返す
- Provider が見つからなければ、`createContext` に渡したデフォルト値を返す

React 19 からは `<ThemeContext value={theme}>` と、`.Provider` を省略して書けるようになりました。

## Provider コンポーネントとカスタムフックにまとめる

実務では、Context をそのまま export せず、**Provider コンポーネントとカスタムフックにまとめる**のが定番です。

```tsx
interface CounterContextValue {
  count: number;
  increment: () => void;
}

// デフォルト値は undefined にする
const CounterContext = createContext<CounterContextValue | undefined>(undefined);

export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount((c) => c + 1), []);
  const value = useMemo(() => ({ count, increment }), [count, increment]);

  return <CounterContext.Provider value={value}>{children}</CounterContext.Provider>;
}

export function useCounter(): CounterContextValue {
  const ctx = useContext(CounterContext);
  if (ctx === undefined) {
    throw new Error("useCounter は CounterProvider の中で使ってください");
  }
  return ctx;
}
```

このパターンの利点は次の通りです。

- **Provider の付け忘れをすぐ検出できる**: デフォルト値を undefined にしてカスタムフックでチェックすると、Provider の外で使った瞬間にわかりやすいエラーが出る。もっともらしいデフォルト値を入れておくと、Provider を付け忘れても気づかず、「なぜか更新されない」という見つけにくいバグになる
- **使う側の型が綺麗**: `useCounter()` の戻り値は `CounterContextValue`（undefined を含まない）なので、毎回 null チェックしなくていい
- **実装を隠せる**: 使う側は `useCounter()` を呼ぶだけで、Context の存在すら知らなくていい

### Provider の外で使ったときのテスト

```tsx
expect(() => renderHook(() => useCounter())).toThrow("useCounter は CounterProvider の中で使ってください");
```

renderHook は Provider で包まずに描画するので、カスタムフックのエラーがそのまま投げられます。

## Context の値が変わると、何が再レンダーされる？

Provider の `value` が変わると、**その Context を `useContext` しているすべてのコンポーネント**が再レンダーされます。値のどの部分を使っているかに関係なく、です。

```tsx
const { user } = useAuth(); // isLoggingIn だけが変わっても、このコンポーネントは再レンダーされる
```

### value をメモ化しないと何が起きるか

```tsx bad
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
  //                                    ↑ レンダーのたびに新しいオブジェクト
}
```

`{ user, logout }` はレンダーのたびに新しいオブジェクトになり、`logout` も毎回新しい関数になります。React は value を `Object.is` で比較するので、**AuthProvider が再レンダーされるたびに「値が変わった」と判断し、すべての利用者を再レンダー**します。user が変わっていなくても、です。

```tsx good
const logout = useCallback(() => setUser(null), []);
const value = useMemo(() => ({ user, logout }), [user, logout]);
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

`useMemo` は「依存配列が変わらない限り、前回の計算結果を返す」フックです（R-09 で詳しく）。これで user が変わったときだけ value が新しくなります。

> **ポイント** Context の value にオブジェクトや関数を渡すときは、useMemo / useCallback でメモ化するのが定石です。頻繁に変わる値と滅多に変わらない値がある場合は、Context を分けるのも有効です（例: `AuthStateContext` と `AuthActionsContext`）。

## 非同期処理を Context に持たせる

ログイン処理のように、非同期で、かつ「処理中」の状態も共有したい場合です。

```tsx
const login = useCallback(
  async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const user = await loginApi(email, password);
      setUser(user);
    } finally {
      setIsLoggingIn(false); // 成功しても失敗しても必ず戻す
    }
  },
  [loginApi],
);
```

ポイントは2つです。

- **`finally`** で「処理中」フラグを必ず戻す。`try` の最後にだけ書くと、失敗したときにフラグが立ったままになり、ボタンが永遠に押せなくなる
- **`catch` で握りつぶさない**。エラーをどう表示するかは UI 側（フォーム）の責任なので、例外はそのまま呼び出し元に伝える。呼び出し側は `try { await login(...) } catch { エラー表示 }` で受け取る

## テストのために依存を外から渡す

課題の AuthProvider は、`login` 関数を props で受け取ります。

```tsx
<AuthProvider login={(email, password) => api.login(email, password)}>
```

Provider の中で直接 `fetch` を呼ぶと、テストのたびに本物の API に通信してしまいます。**外部への依存を props で受け取る**ようにすると、テストでは偽物（モック）の関数を渡せます。R-05 の `fetchUser` を props で受け取ったのも同じ理由です。これは「依存性の注入（DI）」と呼ばれる考え方です。

## Context と状態管理ライブラリ

Context は便利ですが、**状態管理ライブラリの代わりではない**ことを理解しておきましょう。

Context は「値を下に届ける仕組み」であって、それ自体は状態を管理しません（状態は Provider の中の useState / useReducer が持っています）。また、value が変わると利用者全員が再レンダーされるので、**頻繁に変わる値や大きな状態**には向きません。

| | 向いている用途 |
|---|---|
| Context | 滅多に変わらない値: ログインユーザー、テーマ、言語設定、機能フラグ |
| Context + useReducer | 中規模の画面単位の状態（ウィザード形式のフォームなど） |
| Zustand / Jotai | 頻繁に変わる、多くの場所で使うクライアント状態。必要な部分だけ購読できる |
| Redux Toolkit | 大規模で、状態の変化を厳密に追跡したいアプリ |
| TanStack Query | サーバーから取ってきたデータ |

## 課題に入る前に

- Context のデフォルト値は `undefined`。`useAuth` でチェックしてエラーを投げる（メッセージはテストと一字一句同じに）
- AuthProvider: `user` と `isLoggingIn` を state で持ち、`login` は try/finally。`value` は useMemo
- Header / LoginForm は props を受け取らず、`useAuth()` だけで動かす
- LoginForm は、ログイン失敗時のエラー表示用の state を自分で持つ（Context には入れない。他で使わないので）
- ログイン済みなら、フォームの代わりに「ログイン済みです」。ただし**フックは早期 return より前に全部呼ぶ**（R-06 のフックのルール）

## 面接で聞かれたら

<details>
<summary>Q. prop drilling とは？ Context はそれをどう解決しますか？</summary>

深い階層のコンポーネントにデータを渡すために、途中の、そのデータを使わないコンポーネントにも props を経由させることです。途中のコンポーネントが不要な props を知る必要があり、変更にも弱くなります。Context を使うと、上位の Provider で値を提供し、下のどの階層からでも useContext で直接受け取れるので、途中のコンポーネントを経由する必要がなくなります。

</details>

<details>
<summary>Q. Context の値が変わると、どのコンポーネントが再レンダーされますか？</summary>

その Context を useContext で読んでいるすべてのコンポーネントが再レンダーされます。value のうち自分が使っていない部分だけが変わった場合でも再レンダーされます。そのため、頻繁に変わる値を Context に入れると広範囲の再レンダーが起きるので、Context を分割したり、状態管理ライブラリを使ったりします。

</details>

<details>
<summary>Q. Provider の value にオブジェクトリテラルを直接渡すと何が問題ですか？</summary>

Provider のコンポーネントが再レンダーされるたびに新しいオブジェクトが作られ、React は参照で比較するので、中身が同じでも値が変わったと判断します。その結果、Context を使っているすべてのコンポーネントが毎回再レンダーされます。useMemo で value を、useCallback で中の関数をメモ化して、実際に値が変わったときだけ新しいオブジェクトになるようにします。

</details>

<details>
<summary>Q. createContext のデフォルト値を undefined にしてカスタムフックでチェックするパターンの利点は？</summary>

Provider で包み忘れたまま使うと、すぐにわかりやすいエラーが出るので、ミスに早く気づけます。もっともらしいデフォルト値を設定していると、Provider が無くても動いてしまい、「なぜか状態が更新されない」という見つけにくいバグになります。また、カスタムフックの戻り値の型から undefined が除かれるので、使う側で毎回チェックする必要がなく、Context の実装も隠蔽できます。

</details>

<details>
<summary>Q. Context と状態管理ライブラリの使い分けは？</summary>

Context は値をツリーの下に届ける仕組みで、ログインユーザーやテーマなど、あまり変わらない値の共有に向いています。value が変わると利用者全員が再レンダーされるので、頻繁に更新される状態や、多くのコンポーネントが一部だけを使う大きな状態には向きません。そうした場合は、必要な部分だけを購読できる Zustand や Jotai、大規模なら Redux Toolkit を使います。サーバーから取得したデータは TanStack Query などに任せるのが良いと考えています。

</details>

## 理解度チェック

<details>
<summary>1. Provider をネストすると、useContext はどの値を受け取る？</summary>

ツリーを上にたどって**一番近い** Provider の値です。これを利用して、画面の一部だけテーマを変える（内側に別の ThemeProvider を置く）こともできます。

</details>

<details>
<summary>2. <code>&lt;AuthProvider&gt;</code> の children は、user が変わったとき全部再レンダーされる？</summary>

いいえ。AuthProvider が再レンダーされても、`children` は親（App）がすでに作った要素なので、参照が変わらず再レンダーされません。再レンダーされるのは `useAuth()` を呼んでいるコンポーネント（とその子孫）だけです。これは「children として渡すと再レンダーを避けられる」という R-09 のテクニックにもつながります。

</details>
