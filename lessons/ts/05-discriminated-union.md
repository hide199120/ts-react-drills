# 判別可能なユニオン型

## この章で学ぶこと

- リテラル型：`"success"` のような「特定の値だけ」の型
- 判別可能なユニオン型（discriminated union / タグ付きユニオン）
- `switch` による絞り込み
- `never` 型と網羅性チェック（exhaustiveness check）
- 「ありえない状態を型で表現できなくする」設計

この章は TypeScript で**最も実務に効く**テクニックの1つです。React の状態管理（R-05, R-07, R-10）でもそのまま使います。

## リテラル型

`string` は「あらゆる文字列」ですが、**特定の値だけを許す型**も作れます。

```ts
type Direction = "up" | "down" | "left" | "right";

let d: Direction = "up"; // OK
d = "north"; // エラー: "north" は Direction に含まれない
```

エディタの補完も効くようになり、タイプミスをコンパイル時に検出できます。数値や真偽値のリテラル型もあります（`type Dice = 1 | 2 | 3 | 4 | 5 | 6`）。

### const で推論すると型が狭くなる

```ts
let a = "up"; // string（後で別の文字列を入れられるので広く推論）
const b = "up"; // "up"（変更できないのでリテラル型）

const config = { mode: "dark" }; // { mode: string }（プロパティは変更可能なので広がる）
const config2 = { mode: "dark" } as const; // { readonly mode: "dark" }
```

`as const` はオブジェクトや配列を「変更不可・リテラル型のまま」にします。R-04 でフィルタの定義に使います。

## よくある悪い状態設計

API からデータを取ってくる画面の状態を、次のように書いたとします。

```ts bad
interface FetchState {
  loading: boolean;
  data?: User[];
  error?: string;
}
```

一見よさそうですが、この型は**ありえない状態を許してしまいます**。

```ts
const weird1: FetchState = { loading: true, data: [], error: "失敗" }; // 読み込み中なのにデータもエラーもある？
const weird2: FetchState = { loading: false }; // 読み込み完了なのに、データもエラーも無い？
```

boolean とオプショナルが3つあると、組み合わせは 2 × 2 × 2 = 8 通り。そのうち意味のある状態は4つくらいしかありません。表示側では「loading が true で error もあったらどうする？」と、ありえないはずのケースまで考えることになり、バグの温床になります。

## 判別可能なユニオン型

状態ごとに**別の型**を定義し、共通のプロパティ（ここでは `status`）にリテラル型で目印を付けます。

```ts good
type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User[] }
  | { status: "error"; error: string };
```

これで状態はちょうど4つだけになりました。

- `data` は `status: "success"` のときだけ存在する（しかも必須）
- `error` は `status: "error"` のときだけ存在する
- 「読み込み中なのにデータがある」は**型として書けない**

```ts
const s1: FetchState = { status: "success", data: [] }; // OK
const s2: FetchState = { status: "loading", data: [] }; // エラー
const s3: FetchState = { status: "success" }; // エラー: data が必要
```

この共通プロパティ（`status`, `type`, `kind` などの名前がよく使われる）を**判別子（discriminant / タグ）**と呼びます。

### 判別子で絞り込む

判別子をチェックすると、TypeScript はそのブロックの中で型を1つに絞り込みます。

```ts
function render(state: FetchState): string {
  if (state.status === "success") {
    return `${state.data.length}件`; // state は success の型。data にアクセスできる
  }
  if (state.status === "error") {
    return state.error; // state は error の型
  }
  return state.data; // エラー: idle / loading には data が無い
}
```

## switch で場合分けする

状態が多いときは `switch` が読みやすいです。

```ts
type Shape = { kind: "square"; size: number } | { kind: "circle"; radius: number };

function perimeter(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size * 4; // shape: square
    case "circle":
      return 2 * Math.PI * shape.radius; // shape: circle
  }
}
```

各 `case` の中で、`shape` が正しく絞り込まれています。

## never と網羅性チェック

### never 型とは

`never` は「**値が存在しない**」ことを表す型です。どんな値も `never` 型の変数には代入できません。

```ts
let x: never;
x = 1; // エラー
x = "a"; // エラー
```

「絞り込んだ結果、可能性がすべて消えた」とき、その変数の型は `never` になります。

```ts
function f(value: string | number) {
  if (typeof value === "string") return;
  if (typeof value === "number") return;
  value; // ここでは value: never（もう可能性が残っていない）
}
```

### 網羅性チェック

この性質を利用すると、「**ユニオンのすべてのケースを処理したか**」をコンパイラにチェックさせられます。

```ts
function assertNever(value: never): never {
  throw new Error(`想定外の値: ${JSON.stringify(value)}`);
}

function perimeter(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size * 4;
    case "circle":
      return 2 * Math.PI * shape.radius;
    default:
      return assertNever(shape); // ここに来る shape は never 型
  }
}
```

ここで、新しい図形を追加したとします。

```ts
type Shape =
  | { kind: "square"; size: number }
  | { kind: "circle"; radius: number }
  | { kind: "triangle"; a: number; b: number; c: number }; // 追加
```

すると `perimeter` の `default` に来る `shape` は `never` ではなく triangle 型になり、`assertNever(shape)` で**コンパイルエラー**が出ます。

> **ポイント** 型を1か所変えるだけで、「対応が漏れている場所」をコンパイラがすべて教えてくれます。switch 文がアプリ中に散らばっていても、修正漏れが起きません。大きなコードベースほど効果を発揮します。

戻り値の型が `never` の関数（`assertNever`）は「正常には返ってこない（必ず例外を投げる）」ことを表します。実行時に想定外の値（例えば API から未知の `kind` が来た）が渡されたときも、例外で早めに気づけます。

## 実務での使いどころ

判別可能なユニオンは、さまざまな場面で使えます。

```ts
// API の結果
type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

// Redux / useReducer の Action（R-07）
type Action = { type: "add"; item: Item } | { type: "remove"; id: string } | { type: "clear" };

// 支払い方法ごとに必要な情報が違う
type Payment =
  | { method: "card"; cardLast4: string }
  | { method: "bank"; bankName: string }
  | { method: "cash" };
```

「**種類によって持つデータが違うもの**」を見つけたら、判別可能なユニオンを検討しましょう。

## 課題に入る前に

- **assertNever**: 引数を `never` 型にして、例外を投げるだけ
- **area**: `switch (shape.kind)` で3ケース + `default` で `assertNever`。円の面積は `Math.PI * r ** 2`
- **FetchState&lt;T&gt;**: この章の例を、ジェネリクス（TS-04）で data の型を T にしたもの
- **renderState**: FetchState で絞り込みながら文字列を返す

## 面接で聞かれたら

<details>
<summary>Q. <code>{ loading: boolean; data?: T; error?: string }</code> という型の何が問題ですか？</summary>

loading・data・error が独立しているので、「読み込み中なのにエラーもある」「完了したのにデータもエラーも無い」といった、ありえない組み合わせを型が許してしまいます。表示側でそうしたケースまで考慮する必要があり、バグの原因になります。`status` を判別子にした判別可能なユニオンにすれば、状態は idle・loading・success・error の4つだけになり、data は success のときだけ、error は error のときだけ存在する、と型で保証できます。

</details>

<details>
<summary>Q. never 型とは？ 網羅性チェックはなぜ可能なのですか？</summary>

never は値が存在しない型で、どんな値も代入できません。ユニオン型を switch などで絞り込んでいき、すべてのケースを処理すると、残りの default に来る値の型は never になります。そこで never 型の引数を取る関数（assertNever）に渡しておくと、新しいケースをユニオンに追加して処理を書き忘れた場合、default に来る値が never ではなくなるのでコンパイルエラーになります。これで対応漏れをコンパイル時に検出できます。

</details>

## 理解度チェック

<details>
<summary>1. 判別子として使えるプロパティの条件は？</summary>

ユニオンのすべてのメンバーに共通して存在し、それぞれが**リテラル型**（`"success"` など）であること。`status: string` のように広い型だと絞り込みができません。

</details>

<details>
<summary>2. 判別子を分割代入で取り出すと絞り込みはどうなる？</summary>

```ts
const { status } = state;
if (status === "success") state.data;
```

取り出した `status` 変数で比較しても、**元の `state` は絞り込まれず** `state.data` はエラーになります。絞り込みたいオブジェクトのプロパティで `state.status === "success"` と直接比較するのが確実です。

</details>
