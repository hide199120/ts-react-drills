# unknown と型ガード

## この章で学ぶこと

- `any` と `unknown` の違い
- 「型の境界」：外から来るデータは信用できない
- ユーザー定義型ガード `value is T`
- `JSON.parse` と `try / catch` の安全な扱い方
- `catch` で受け取るエラーの扱い方
- `as`（型アサーション）が危険な理由と、zod などのスキーマバリデーション

## TypeScript の型は実行時には存在しない

まず大前提です。TypeScript の型はコンパイル時にすべて消えます。

```ts
interface User {
  id: number;
  name: string;
}

const res = await fetch("/api/user");
const user: User = await res.json(); // ← コンパイルは通る
console.log(user.name.toUpperCase()); // ← サーバーが name を返さなかったら実行時エラー
```

`res.json()` の戻り値は `any` なので、どんな型の変数にも代入できてしまいます。でも実際にサーバーが何を返すかは、TypeScript には知りようがありません。

**API のレスポンス、`JSON.parse` の結果、`localStorage` の値、フォーム入力、`catch` したエラー**など、プログラムの外から来るデータは「型の境界」にあります。ここで型を確かめずに使うと、型安全は見せかけになります。

## any と unknown

どちらも「何でも入る型」ですが、性質は正反対です。

```ts
let a: any = JSON.parse(input);
a.foo.bar(); // コンパイルOK（何でも許す）→ 実行時に落ちるかも
const n: number = a; // どこにでも代入できる

let u: unknown = JSON.parse(input);
u.foo; // エラー: unknown のままでは何もできない
const m: number = u; // エラー: unknown は他の型に代入できない
```

| | `any` | `unknown` |
|---|---|---|
| 何でも代入できる | ○ | ○ |
| プロパティアクセス・呼び出し | ○（チェックなし） | ✕（絞り込みが必要） |
| 他の型の変数に代入 | ○ | ✕ |
| 安全性 | 型チェックを**無効化** | 確かめるまで**使わせない** |

**「何が来るかわからない」なら `unknown` を使い、使う前に確かめる**のが正解です。`any` は型チェックを無効にするので、使うほど TypeScript を使う意味が薄れます。

## unknown を絞り込む

TS-01 で学んだ絞り込みが、そのまま使えます。

```ts
function printLength(value: unknown) {
  if (typeof value === "string") {
    console.log(value.length); // string
  } else if (Array.isArray(value)) {
    console.log(value.length); // any[]
  }
}
```

### オブジェクトのプロパティを確かめる

オブジェクトの場合は少し手間がかかります。

```ts
function getName(value: unknown): string | undefined {
  if (
    typeof value === "object" && // オブジェクトか（null と配列も通ってしまう）
    value !== null && // null を除く
    "name" in value && // name プロパティがあるか
    typeof value.name === "string" // name が文字列か
  ) {
    return value.name;
  }
  return undefined;
}
```

TypeScript 4.9 以降、`"name" in value` でチェックすると `value.name` にアクセスできるようになります（型は `unknown`）。それをさらに `typeof` で確かめます。

> **注意** `typeof value === "object"` は `null` と配列でも true になります。「普通のオブジェクト」を判定したいなら `value !== null && !Array.isArray(value)` も必要です。

## ユーザー定義型ガード

上のような判定を何度も書くのは大変なので、関数にまとめます。ただし普通に `boolean` を返すだけでは、呼び出し側で絞り込みが効きません。

```ts
function isString(v: unknown): boolean {
  return typeof v === "string";
}

if (isString(x)) {
  x.toUpperCase(); // エラー: x はまだ unknown
}
```

戻り値の型を **`v is 型`** にすると、「この関数が true を返したら、v はその型だ」と TypeScript に伝えられます。これを**ユーザー定義型ガード**と呼びます。

```ts
function isString(v: unknown): v is string {
  return typeof v === "string";
}

if (isString(x)) {
  x.toUpperCase(); // OK: x は string に絞り込まれる
}
```

### 型ガードを組み合わせる

小さな型ガードを作っておくと、大きな判定が読みやすくなります。

```ts
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

interface Product {
  id: string;
  price: number;
}

function isProduct(v: unknown): v is Product {
  return isRecord(v) && typeof v.id === "string" && typeof v.price === "number";
}
```

`isRecord` を通った後は `v` が `Record<string, unknown>` になるので、`v.id` のように自由にアクセスでき、値はすべて `unknown` 型なので確かめてから使うことになります。

### 配列の中身を確かめる

```ts
function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === "string");
}
```

### filter と組み合わせる

型ガードは `filter` に渡すと、結果の配列の型も絞り込まれます。

```ts
const mixed: unknown[] = [1, "a", 2, "b"];
const strings = mixed.filter(isString); // string[]

const maybe = [1, null, 2, undefined];
const nums = maybe.filter((x): x is number => x != null); // number[]
```

> **注意** 型ガードの中身が間違っていても、**TypeScript は `v is T` を信じます**。`return true` と書けば何でも T 扱いになってしまいます。型ガードは「人間が書いた保証」なので、中身は慎重に、そしてテストを書きましょう。

## JSON.parse と try / catch

`JSON.parse` は、文字列が JSON として壊れていると**例外を投げます**。

```ts
JSON.parse('{"a": 1}'); // { a: 1 }
JSON.parse("{broken"); // SyntaxError が投げられる
```

外部からの文字列をパースするときは `try / catch` で囲みます。

```ts
function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined; // パースできなかった
  }
}
```

`catch (e)` の `(e)` は、使わないなら省略できます（ES2019〜）。戻り値を `unknown` にしているのがポイントで、呼び出し側に「中身は確かめてから使ってね」と伝えています。

## catch で受け取るエラーの型

`catch (e)` の `e` は `unknown` 型です（`useUnknownInCatchVariables`、strict で有効）。

```ts
try {
  doSomething();
} catch (e) {
  console.log(e.message); // エラー: e は unknown
}
```

なぜ `Error` 型ではないのか。JavaScript では **`throw` に何でも渡せる**からです。

```ts
throw new Error("普通のエラー");
throw "文字列"; // これも合法
throw { code: 404 }; // オブジェクトも
throw null; // null も
```

なので、`e` を使う前に確かめます。

```ts
catch (e) {
  if (e instanceof Error) {
    console.log(e.message); // e: Error
  } else {
    console.log("不明なエラー", e);
  }
}
```

`instanceof Error` は、`TypeError` や `SyntaxError` など Error を継承したクラスでも true になります。

## as（型アサーション）の危険性

`as` は「私はこの値の型を知っている」とコンパイラに主張する構文です。

```ts
const user = JSON.parse(text) as User; // コンパイラは信じる
```

これは**型チェックを人間の思い込みで上書きしている**だけで、実行時には何も確かめていません。中身が違えば、離れた場所で謎のエラーになります。

`as` を使ってよいのは、だいたい次のようなときだけです。

- 型システムの限界で、正しいとわかっているのに表現できないとき（TS-03 の `reduce` の初期値 `{} as Record<...>` など）
- テストコードでのモック
- `as const`（これは安全。型を狭めるだけ）

外部データに対しては `as` ではなく、型ガードやスキーマバリデーションで**実際に確かめる**べきです。

## 実務ではスキーマバリデーション

型ガードを手で書くのは大変で、型定義とずれることもあります。実務では **zod** や **valibot** などのライブラリを使うのが一般的です。

```ts
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  tags: z.array(z.string()),
});

type User = z.infer<typeof UserSchema>; // スキーマから型を生成

const result = UserSchema.safeParse(JSON.parse(text));
if (result.success) {
  result.data.name; // User 型。実行時にも検証済み
} else {
  console.log(result.error.issues); // どこが違うか詳細なエラー
}
```

スキーマ（実行時の検証ルール）から型を生成するので、**検証と型が絶対にずれません**。この章で手書きした型ガードは、zod が内部でやっていることを理解するための練習です。

## 課題に入る前に

- **isUser**: `isRecord` のような小さな型ガードを先に作ると楽です。tags は「配列であること」と「全要素が string であること」の両方をチェック
- **parseUsers**: `try/catch` でパース → 配列か確かめる → `filter(isUser)`
- **getErrorMessage**: 判定の順番は Error → string → message を持つオブジェクト → それ以外
- **pick**: ジェネリクス（TS-04）の復習。戻り値は `Pick<T, K>`
- ルール: `as` は pick の初期化以外では禁止。型ガードで正しく絞り込んでください

## 面接で聞かれたら

<details>
<summary>Q. any と unknown の違いは？ 外部入力に unknown を使う理由は？</summary>

どちらも任意の値を受け取れますが、any は型チェックを無効にするので、プロパティアクセスも他の型への代入も自由にできてしまいます。unknown は、絞り込みで型を確かめるまでは何も操作できません。API のレスポンスや JSON.parse の結果、catch したエラーは実行時に何が来るか保証がないので、unknown で受けて確かめてから使うことで、想定外のデータによる実行時エラーを防げます。

</details>

<details>
<summary>Q. <code>value is User</code> を返す関数の中身が間違っていたらどうなりますか？</summary>

TypeScript は型ガードの戻り値を信じるので、中身が間違っていても、true を返せばその値を User として扱います。コンパイルエラーにはならず、実行時に存在しないプロパティにアクセスしてエラーになります。型ガードは型チェックの穴になりうるので、慎重に書いてテストすること、可能なら zod などのライブラリを使うことが大事です。

</details>

<details>
<summary>Q. zod などのスキーマバリデーションを使うメリットは？</summary>

実行時の検証ルールと TypeScript の型を1つのスキーマから作れるので、検証と型が食い違うことがありません。手書きの型ガードより短く書け、どのフィールドがなぜ不正かという詳細なエラーも得られます。API レスポンスの検証、フォームのバリデーション、環境変数のチェックなど、型の境界で広く使えます。

</details>

## 理解度チェック

<details>
<summary>1. <code>catch (e: Error)</code> と書けないのはなぜ？</summary>

JavaScript では Error 以外の値も throw できるため、catch した値が Error である保証がないからです。TypeScript では catch の変数に付けられる型注釈は `unknown` か `any` だけです。

</details>

<details>
<summary>2. <code>arr.filter((x) =&gt; x !== null)</code> の結果の型が <code>(T | null)[]</code> のままになるのはなぜ？</summary>

古い TypeScript では、アロー関数が boolean を返すだけでは型ガードと認識されなかったためです。`(x): x is T => x !== null` と書けば絞り込まれます。なお TypeScript 5.5 以降は、こうした単純な条件なら型ガードを自動で推論してくれるようになりました（Inferred Type Predicates）。

</details>
