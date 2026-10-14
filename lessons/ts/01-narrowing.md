# 型の絞り込み（narrowing）

## この章で学ぶこと

TypeScript の型注釈の基本と、**ユニオン型を「絞り込んで」安全に扱う方法**を学びます。

- 型注釈の書き方（変数・引数・戻り値）
- ユニオン型 `A | B` とは何か
- `typeof` / `Array.isArray` / `in` / `instanceof` による絞り込み
- `null` と `undefined` の扱い、`==` と `===`
- 数値変換と `NaN` の落とし穴

TypeScript で書くコードの大半は、「いくつかの可能性がある値を、場合分けして処理する」ことです。この章はその土台です。

## 型注釈の基本

TypeScript では、変数・関数の引数・戻り値に型を書けます。

```ts
const userName: string = "Taro";
let age: number = 30;
const tags: string[] = ["admin", "dev"];

// 引数と戻り値の型
function greet(name: string, times: number): string {
  return `${name}さん、こんにちは`.repeat(times);
}

// アロー関数
const double = (n: number): number => n * 2;
```

ただし、**すべてに型を書く必要はありません**。TypeScript は初期値から型を推論します。

```ts
const userName = "Taro"; // string と推論される
const nums = [1, 2, 3]; // number[] と推論される
```

実務での目安はこうです。

- **関数の引数**: 必ず書く（推論できないため）
- **関数の戻り値**: 公開する関数（export するもの）には書くと、意図しない型の変化に気づける
- **ローカル変数**: 推論に任せる

> **ポイント** 型注釈は「こうあってほしい」という宣言です。戻り値に型を書いておくと、実装を間違えたときに「関数の中」でエラーになります。書かないと、間違った型がそのまま呼び出し側に伝わってしまい、離れた場所でエラーになります。

## ユニオン型：「AかBのどちらか」

`|` でつなぐと「どれか1つ」を表す型になります。

```ts
let id: string | number;
id = 42; // OK
id = "abc-1"; // OK
id = true; // エラー: boolean は代入できない
```

ユニオン型の値は、**そのままでは「全員に共通する操作」しかできません**。

```ts
function show(id: string | number) {
  id.toUpperCase(); // エラー: number には toUpperCase がない
  id.toFixed(2); // エラー: string には toFixed がない
  String(id); // OK: どちらでも使える
}
```

ここで必要になるのが「絞り込み」です。

## 絞り込み（narrowing）

条件分岐を書くと、TypeScript はその分岐の中で型を自動的に狭めてくれます。これを **narrowing（絞り込み）** と呼びます。

### typeof：プリミティブ型の判定

```ts
function show(id: string | number) {
  if (typeof id === "string") {
    // ここでは id: string
    return id.toUpperCase();
  }
  // ここに来るのは number だけなので id: number
  return id.toFixed(2);
}
```

`typeof` が返す文字列は次の通りです。

| 値 | `typeof` の結果 |
|---|---|
| `"abc"` | `"string"` |
| `42`, `NaN` | `"number"` |
| `true` | `"boolean"` |
| `undefined` | `"undefined"` |
| `() => {}` | `"function"` |
| `{}`, `[]`, **`null`** | `"object"` |

> **注意** `typeof null` は `"object"` です（JavaScript 初期からの有名なバグで、互換性のため直せない）。配列も `"object"` です。なので、オブジェクトや配列の判定に `typeof` だけを使うのは危険です。

### Array.isArray：配列の判定

配列かどうかは `Array.isArray` で判定します。これも絞り込みに対応しています。

```ts
function count(value: string | string[]) {
  if (Array.isArray(value)) {
    return value.length; // value: string[]
  }
  return 1; // value: string
}
```

### in：プロパティの有無で判定

オブジェクトの形で区別したいときは `in` 演算子が使えます。

```ts
type Dog = { bark: () => void };
type Cat = { meow: () => void };

function speak(animal: Dog | Cat) {
  if ("bark" in animal) {
    animal.bark(); // animal: Dog
  } else {
    animal.meow(); // animal: Cat
  }
}
```

### instanceof：クラスのインスタンスか判定

```ts
function format(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString(); // value: Date
  }
  return value;
}
```

`instanceof` はクラス（コンストラクタ）で作られた値にしか使えません。`Error` の判定でよく使います（TS-07 で再登場します）。

### 早期 return で絞り込む

絞り込みは `if` の中だけでなく、**return した後の残りの部分**にも効きます。

```ts good
function label(value: string | null): string {
  if (value === null) return "なし"; // null をここで処理して抜ける
  return value.trim(); // ここでは value: string
}
```

ネストが深くならず読みやすいので、実務ではこの「早期 return（ガード節）」をよく使います。

## null と undefined

JavaScript には「値がない」ことを表すものが2つあります。

- `undefined`: 「まだ値が入っていない」。初期化していない変数、存在しないプロパティ、引数の省略など
- `null`: 「値がないことを意図的に表す」。API が「該当なし」を返すときなど

TypeScript の `strict` モード（このリポジトリでも有効）では、`null` や `undefined` は型に明示しないと代入できません。

```ts
let name: string = null; // エラー
let name2: string | null = null; // OK
```

### `===` と `==` の違い

- `===`（厳密等価）: 型も値も同じなら true
- `==`（等価）: 型が違うと変換してから比較する。ルールが複雑で予想外の結果になりやすい

```ts
0 == ""; // true  ← 直感に反する
0 === ""; // false
```

原則は **常に `===` を使う** です。ただし、**唯一の例外として `value == null` は慣用的に使われます**。

```ts
value == null; // value が null または undefined のときだけ true
// ↑ これは次と同じ意味
value === null || value === undefined;
```

`== null` は `null` と `undefined` の**両方だけ**にマッチし、`0` や `""` にはマッチしません。この性質を知った上で使うのは問題ありません（ESLint の `eqeqeq` ルールにも `null` だけ許可するオプションがあります）。

### オプショナルチェーンと Null 合体演算子

`null` / `undefined` かもしれない値を扱う構文も覚えておきましょう。

```ts
const user: { profile?: { name: string } } | null = getUser();

// ?. : 途中が null/undefined なら、そこで止めて undefined を返す
const name = user?.profile?.name; // string | undefined

// ?? : 左が null/undefined のときだけ右を使う
const display = name ?? "名無し";
```

> **注意** `??` と `||` は違います。`||` は `0` や `""` や `false` でも右側を使ってしまいます。`count || 10` は `count` が `0` のとき `10` になってしまうので、「未設定なら」という意味なら `count ?? 10` と書きます。

## 数値への変換と NaN

文字列を数値にする方法はいくつかあり、挙動が微妙に違います。

```ts
Number("42"); // 42
Number("3.5"); // 3.5
Number(""); // 0      ← 空文字は 0 になる
Number("abc"); // NaN
Number("12px"); // NaN

parseFloat("12px"); // 12   ← 先頭から読める部分だけ読む
parseInt("08", 10); // 8    ← 基数（10）は必ず指定する
```

**`NaN`（Not a Number）は「数値型だけど数値ではない」特殊な値**です。厄介な性質があります。

```ts
typeof NaN; // "number"  ← 型としては number
NaN === NaN; // false     ← 自分自身とも等しくない！
Number.isNaN(NaN); // true      ← 判定はこれを使う
```

`NaN` は計算に混ざると結果を全部 `NaN` にしてしまいます（`1 + NaN` は `NaN`）。外部から来た文字列を数値に変換したら、**`Number.isNaN` でチェックしてから使う**のが鉄則です。

> **注意** グローバル関数の `isNaN("abc")` は、引数を先に数値変換するので `true` になります。`Number.isNaN("abc")` は「`NaN` そのものか」を見るので `false` です。意図が明確な `Number.isNaN` を使いましょう。

## 文字列の基本操作

課題で使う文字列メソッドをまとめておきます。

```ts
"  hello ".trim(); // "hello"（前後の空白を除去）
"abc".toUpperCase(); // "ABC"
"7".padStart(3, "0"); // "007"（指定の長さになるまで先頭を埋める）
["a", "b", "c"].join(", "); // "a, b, c"
`ID: ${id}`; // テンプレートリテラル
```

## 課題に入る前に

課題 TS-01 では3つの関数を書きます。考え方のヒントです。

- **formatId**: `typeof` で number と string に分岐。number のほうは「数値 → 文字列 → ゼロ埋め」の順
- **describeValue**: 判定の**順番**が大事。null/undefined → 配列 → 文字列の順に早期 return すると素直に書ける
- **sumNumbers**: 「number ならそのまま、string なら変換」してから、`NaN` でなければ足す。`reduce` を使うと1つの式で書けますが、まずは `for...of` で書いても構いません

雛形の `throw new Error("TODO")` を消して、実装を書いてください。

## 面接で聞かれたら

<details>
<summary>Q. typeof / Array.isArray / in / instanceof の違いと使い分けは？</summary>

`typeof` は string・number・boolean などプリミティブ型の判定に使います。ただし `null` や配列も `"object"` になるので、オブジェクトの判定には向きません。配列は `Array.isArray` で判定します。オブジェクト同士を「どのプロパティを持っているか」で区別したいときは `in`、クラスのインスタンスかどうか（`Date` や `Error` など）は `instanceof` を使います。いずれも TypeScript が分岐の中で型を絞り込んでくれます。

</details>

<details>
<summary>Q. == と === の違いは？ value == null は何にマッチしますか？</summary>

`===` は型変換をせず、型と値が両方同じときだけ true です。`==` は型が違うと暗黙に変換してから比較するため、`0 == ""` が true になるなど予想しづらい挙動があるので、基本は `===` を使います。例外が `value == null` で、これは `null` と `undefined` の両方だけにマッチし、`0` や空文字にはマッチしません。「値が無い」ことをまとめて判定したいときの慣用句として使われます。

</details>

<details>
<summary>Q. NaN の判定はどうしますか？</summary>

`Number.isNaN(value)` を使います。`NaN` は自分自身とも等しくない（`NaN === NaN` が false）ので、`===` では判定できません。グローバルの `isNaN` は引数を数値に変換してから判定するので、`isNaN("abc")` が true になるなど意図と違う結果になることがあります。

</details>

## 理解度チェック

<details>
<summary>1. 次のコードの x の型は、それぞれの行でどうなる？</summary>

```ts
function f(x: string | number | null) {
  if (x == null) return;
  // ①
  if (typeof x === "number") return;
  // ②
}
```

① は `string | number`（null が除かれた）、② は `string`（さらに number が除かれた）。早期 return の後にも絞り込みが効きます。

</details>

<details>
<summary>2. <code>const count = input || 10</code> の問題点は？</summary>

`input` が `0` のとき（ユーザーが意図的に 0 を指定したとき）も `10` になってしまいます。「未指定のときだけ 10」にしたいなら `input ?? 10` と書きます。

</details>
