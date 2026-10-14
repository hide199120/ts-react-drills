# ジェネリクス

## この章で学ぶこと

- なぜジェネリクスが必要か（`any` との違い）
- 型引数 `<T>` の書き方と、型の推論
- 制約 `extends` で「こういう型に限る」と指定する
- `keyof` と インデックスアクセス型 `T[K]`
- ジェネリックなインターフェースとファクトリ関数

ジェネリクスは「型の引数」です。最初は記号が多くて怖く見えますが、`Array<string>` や `Promise<User>`、React の `useState<number>` など、すでに毎日使っています。この章で「使う側」から「作る側」になりましょう。

## なぜジェネリクスが必要か

「配列の先頭要素を返す関数」を考えます。

```ts
function firstNumber(arr: number[]): number | undefined {
  return arr[0];
}
function firstString(arr: string[]): string | undefined {
  return arr[0];
}
// 型ごとに同じ関数を書くのは無駄…
```

`any` を使えば1つにまとめられますが、型情報が失われます。

```ts bad
function first(arr: any[]): any {
  return arr[0];
}

const n = first([1, 2, 3]); // n: any
n.toUpperCase(); // エラーにならない！実行時にクラッシュ
```

**ジェネリクスを使うと、「入ってきた型」と「出ていく型」の関係を保ったまま、どんな型にも対応できます**。

```ts good
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]); // n: number | undefined
const s = first(["a", "b"]); // s: string | undefined
n.toUpperCase(); // エラー: number に toUpperCase は無い ← 正しく検出
```

`<T>` は「この関数は、呼ばれるときに決まる型 T を使う」という宣言です。T は変数のようなもので、名前は何でも構いません（慣習で `T`, `U`, `K`, `V` などを使います）。

## 型引数は推論される

呼び出すときに型を明示することもできますが、**通常は引数から推論させます**。

```ts
first<number>([1, 2, 3]); // 明示（普通は書かない）
first([1, 2, 3]); // 推論で T = number
```

関数を設計するときのコツは、「**呼び出し側が `<...>` を書かなくて済むようにする**」ことです。引数に T が登場していれば推論されます。

逆に、引数に T が無い関数では推論できないので、呼び出し側が明示します。

```ts
function createList<T>(): T[] {
  return [];
}
const list = createList<string>(); // T は引数から推論できないので明示
```

React の `useState<User | null>(null)` も同じ理由です。`null` だけからは「後で User が入る」ことがわからないので明示しています。

## 複数の型引数

```ts
function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}
const p = pair("x", 1); // [string, number]

function mapValues<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}
const lengths = mapValues(["a", "bb"], (s) => s.length); // number[]
// s は string と推論され、戻り値から U = number も推論される
```

## 制約 extends：「こういう型に限る」

T には何でも入るので、T の値に対しては「どんな型にもある操作」しかできません。

```ts
function getLength<T>(value: T): number {
  return value.length; // エラー: T に length があるとは限らない
}
```

`extends` で**制約**を付けると、「T は少なくともこの形を持つ」と保証できます。

```ts
function getLength<T extends { length: number }>(value: T): number {
  return value.length; // OK
}

getLength("hello"); // OK: string は length を持つ
getLength([1, 2, 3]); // OK: 配列も length を持つ
getLength(123); // エラー: number は length を持たない
```

ここでの `extends` は「継承」ではなく「**〜に代入可能な型に限る**」という意味です。

## keyof とインデックスアクセス型

### keyof：キーのユニオン型

`keyof T` は「T のキー名のユニオン型」です。

```ts
interface User {
  id: number;
  name: string;
  age: number;
}

type UserKey = keyof User; // "id" | "name" | "age"
```

### T[K]：プロパティの型を取り出す

```ts
type NameType = User["name"]; // string
type IdOrAge = User["id" | "age"]; // number
```

### 組み合わせる：型安全なプロパティアクセス

この2つとジェネリクスを組み合わせると、「オブジェクトと、そのキーを受け取って、値を返す」関数が型安全に書けます。

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Taro", age: 30 };
const name = getProp(user, "name"); // string
const age = getProp(user, "age"); // number
getProp(user, "email"); // エラー: "email" は keyof User に含まれない
```

読み解くとこうなります。

1. `T` は渡されたオブジェクトの型（推論で `{ id: number; name: string; age: number }`）
2. `K extends keyof T` で、K は「T のキーのどれか」に限られる
3. 戻り値 `T[K]` は「T の K プロパティの型」。K が `"name"` なら `string`

**この `K extends keyof T` と `T[K]` のセットは、ジェネリクスで最も頻出のパターン**です。lodash の `pick` や `sortBy`、フォームライブラリの `register("email")` など、多くのライブラリがこの仕組みで型安全を実現しています。

## ジェネリックなインターフェース

型定義にも型引数を持たせられます。

```ts
interface ApiResponse<T> {
  data: T;
  status: number;
}

const res: ApiResponse<User[]> = { data: [], status: 200 };

interface Box<T> {
  get(): T;
  set(value: T): void;
}
```

### ファクトリ関数との組み合わせ

TS-02 のクロージャと組み合わせると、型安全な「入れ物」を作れます。

```ts
function createBox<T>(initial: T): Box<T> {
  let value = initial;
  return {
    get: () => value,
    set: (v) => {
      value = v; // v は T と推論される（戻り値の型 Box<T> から）
    },
  };
}

const box = createBox(10); // Box<number>
box.set(20); // OK
box.set("x"); // エラー
```

## NoInfer：推論に使わせない（発展）

複数の引数に T が出てくると、TypeScript は全部の引数から T を推論しようとします。

```ts
function withDefault<T>(value: T, fallback: T): T {
  return value ?? fallback;
}
withDefault("a", 1); // T = string | number と推論され、エラーにならない
```

「T は1つ目の引数で決めて、2つ目はそれに従わせたい」場合は、TypeScript 5.4 から使える `NoInfer<T>` で推論の対象から外せます。

```ts
function withDefault<T>(value: T, fallback: NoInfer<T>): T {
  return value ?? fallback;
}
withDefault("a", 1); // エラー: number は string に代入できない
```

## 課題に入る前に

- **first / pluck**: この章の例とほぼ同じです。pluck は `getProp` を配列版にしたもの。戻り値の型は `T[K]` の配列
- **createStack**: `createBox` と同じ構造。内部に `T[]` を持ち、`Stack<T>` を返す。`peek` は最後の要素（`arr.at(-1)` が便利）
- **mergeDefaults**: `overrides` は `Partial<T>`。ただし `Partial<T>` からも T が推論されてしまうので、型テストを通すには一工夫必要です（ヒント: 上の発展セクション）
- `any` と `as` は禁止。テストの型チェックで検出されます

## 面接で聞かれたら

<details>
<summary>Q. ジェネリクスを使うメリットは？ any や unknown との違いは？</summary>

型を引数のように扱えるので、さまざまな型に対応する関数やクラスを、型安全なまま1つにまとめて書けます。`any` も任意の型を受け取れますが、型チェックが無効になり、戻り値も `any` になるので誤りを検出できません。`unknown` は安全ですが、使う前に絞り込みが必要で「入力と出力の型の関係」は表現できません。ジェネリクスは「渡された型がそのまま戻り値に反映される」という関係を保てるのが利点です。

</details>

<details>
<summary>Q. <code>K extends keyof T</code> の extends は何を意味しますか？</summary>

型引数の制約で、「K は keyof T に代入可能な型に限る」という意味です。つまり K は T のキー名のどれかでなければならず、存在しないキーを渡すとコンパイルエラーになります。クラスの継承の extends とは意味が違います。

</details>

<details>
<summary>Q. <code>T[K]</code> は何型ですか？</summary>

インデックスアクセス型で、「型 T の、キー K のプロパティの型」です。例えば `User["name"]` は `string` になります。K がユニオンなら、それぞれのプロパティの型のユニオンになります。ジェネリクスと組み合わせて、渡したキーに応じて戻り値の型が変わる関数を書くのに使います。

</details>

## 理解度チェック

<details>
<summary>1. 次の関数の問題点は？</summary>

```ts
function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}
```

空配列のときは `undefined` が返るのに、戻り値の型が `T` になっています（このリポジトリの設定では `noUncheckedIndexedAccess` によりエラーになります）。戻り値は `T | undefined` にすべきです。

</details>

<details>
<summary>2. <code>getProp(user, key)</code> の key が変数 <code>let key = "name"</code> だとエラーになるのはなぜ？</summary>

`let` で宣言すると key の型は `string` に広がる（widening）ため、`keyof User` に代入できません。`const key = "name"`（型は `"name"`）にするか、`let key: keyof User = "name"` と型を付けます。

</details>
