# 型レベルプログラミング

## この章で学ぶこと

- Mapped Types：オブジェクト型をループして新しい型を作る
- 修飾子（`readonly` / `?`）の付け外し
- Conditional Types：型の条件分岐
- `infer`：型の一部を取り出すパターンマッチ
- 分配（distributive）条件型
- Key Remapping とテンプレートリテラル型
- 再帰的な型

TS-06 で使った `Pick` や `Partial` は、すべてこの章の機能で作られています。仕組みを知ると、ライブラリの複雑な型定義が読めるようになり、型エラーの意味もわかるようになります。

> **ポイント** アプリケーション開発で、ここまで複雑な型を自分で書く機会は多くありません。目標は「**書ける**」より「**読める**」こと。面接では「Partial を自作してください」のような形でよく出ます。

## Mapped Types

`{ [K in キーのユニオン]: 型 }` で、ユニオンの各要素をキーにしたオブジェクト型を作れます。

```ts
type Flags = { [K in "dark" | "compact" | "beta"]: boolean };
// { dark: boolean; compact: boolean; beta: boolean }
```

`for...in` ループの型版だと思ってください。`K` には `"dark"`, `"compact"`, `"beta"` が順番に入ります。

### keyof と組み合わせる

`keyof T` でキーのユニオンを取り出してループすると、**既存の型の各プロパティを加工**できます。

```ts
interface User {
  id: number;
  name: string;
}

type Stringify<T> = { [K in keyof T]: string };
type S = Stringify<User>; // { id: string; name: string }

type Nullable<T> = { [K in keyof T]: T[K] | null };
type N = Nullable<User>; // { id: number | null; name: string | null }
```

`T[K]` は TS-04 で学んだインデックスアクセス型で、「元のプロパティの型」です。

### 修飾子の付け外し

`readonly` と `?` を付けたり、`-` で外したりできます。

```ts
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }; // readonly を付ける
type Mutable<T> = { -readonly [K in keyof T]: T[K] }; // readonly を外す
type Optional<T> = { [K in keyof T]?: T[K] }; // ? を付ける
type Concrete<T> = { [K in keyof T]-?: T[K] }; // ? を外す（= Required）
```

`{ [K in keyof T]: ... }` の形（**homomorphic mapped type** と呼びます）は、元の型の `readonly` や `?` を**そのまま引き継ぎます**。なので、修飾子を何も書かなければ元のままになります。

### 一部のキーだけをループする

`keyof T` の代わりに、別の型パラメータで受け取ったキーのユニオンをループすることもできます。

```ts
type WithDefaults<T, K extends keyof T> = { [P in K]: T[P] | "default" };
type W = WithDefaults<User, "name">; // { name: string | "default" }
```

`Pick<T, K>` の自作は、この形で「K をループして、元の型 `T[P]` を値にする」だけです。K に制約（`K extends keyof T`）を付けないと `T[P]` がエラーになり、存在しないキーも受け付けてしまう点に注意してください。

## Conditional Types

`A extends B ? X : Y` は「A が B に代入可能なら X、そうでなければ Y」という**型の三項演算子**です。

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>; // false
```

`extends` は TS-04 の制約と同じく「代入可能か」を意味します。

## infer：型の一部を取り出す

条件型の `extends` の右側で `infer 変数名` と書くと、**マッチした部分を型変数として取り出せます**。パターンマッチのようなものです。

```ts
// 配列の要素の型を取り出す
type ElementType<T> = T extends (infer E)[] ? E : never;

type E1 = ElementType<string[]>; // string
type E2 = ElementType<number>; // never（配列ではないので）
```

「T が `何か[]` の形なら、その『何か』を E と呼んで E を返す」と読みます。

```ts
// Promise の中身を取り出す
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type U1 = Unwrap<Promise<User>>; // User
type U2 = Unwrap<string>; // string

// 関数の第1引数の型
type FirstArg<F> = F extends (first: infer A, ...rest: never[]) => unknown ? A : never;
type F1 = FirstArg<(id: number, name: string) => void>; // number
```

`ReturnType` も同じ考え方で、「関数の形にマッチさせて、戻り値の部分を infer で取り出す」だけです。

### readonly 配列とタプル

```ts
type ElementType<T> = T extends (infer E)[] ? E : never;
type X = ElementType<readonly ["a", "b"]>; // never になってしまう！
```

`readonly` 配列は通常の配列に代入できない（変更できないものを、変更できるものとして扱えない）ため、マッチしません。`readonly (infer E)[]` と書くと、通常の配列も readonly 配列も両方マッチします（通常の配列は readonly 配列に代入できるため）。

## 分配条件型（distributive conditional types）

条件型に**ユニオン型を渡すと、各メンバーごとに条件が評価され、結果がユニオンでまとめられます**。

```ts
type ToArray<T> = T extends unknown ? T[] : never;

type R = ToArray<string | number>;
// = ToArray<string> | ToArray<number>
// = string[] | number[]    ← (string | number)[] ではない
```

組み込みの `Exclude` はこの性質を利用しています。

```ts
type MyExclude<T, U> = T extends U ? never : T;

type R = MyExclude<"a" | "b" | "c", "a">;
// = ("a" extends "a" ? never : "a") | ("b" extends "a" ? never : "b") | ("c" extends ...)
// = never | "b" | "c"
// = "b" | "c"     ← never はユニオンから消える
```

**ユニオンの中の `never` は消える**、という性質と組み合わせるのがポイントです。

分配させたくないときは、`[T] extends [U]` のように両側をタプルで囲みます。

## Key Remapping とテンプレートリテラル型

### テンプレートリテラル型

文字列リテラル型を組み立てられます。

```ts
type EventName = `on${"Click" | "Hover"}`; // "onClick" | "onHover"
type Getter = `get${Capitalize<"name">}`; // "getName"
```

`Capitalize` / `Uncapitalize` / `Uppercase` / `Lowercase` は組み込みの文字列操作型です。

### as でキー名を変える

Mapped Types で `as` を使うと、**キー名を変換**できます。

```ts
type Prefixed<T> = {
  [K in keyof T as `data_${K & string}`]: T[K];
};
type P = Prefixed<{ id: number; name: string }>;
// { data_id: number; data_name: string }
```

`K & string` としているのは、`keyof T` には `number` や `symbol` のキーも含まれうるので、テンプレートリテラルに埋め込める `string` だけに絞るためです。

### as で never を返すとキーが消える

```ts
// 値が関数のプロパティだけ残す
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};
```

キーを `never` にすると、そのプロパティは結果から消えます。条件に合うキーだけを残すフィルタとして使えます。

## キーをユニオンとして取り出すテクニック

「値の型が X のキーだけのユニオン」が欲しいときの定番パターンです。

```ts
type KeysMatching<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
```

2段階で読みます。

1. Mapped Type で「条件に合えばキー名、合わなければ never」を値にしたオブジェクト型を作る
   - `{ a: string; b: number }` → `{ a: "a"; b: never }`
2. `[keyof T]` で全プロパティの値のユニオンを取る → `"a" | never` → `"a"`

## 再帰的な型

型は自分自身を参照できます。

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

interface Settings {
  theme: { color: string; size: number };
  notify: boolean;
}

type S = DeepPartial<Settings>;
// { theme?: { color?: string; size?: number }; notify?: boolean }
```

値がオブジェクトならさらに再帰し、そうでなければそのまま。配列や関数も `object` に含まれる点は、厳密に作るなら考慮が必要です（課題ではそこまで不要）。

## 型のデバッグ方法

複雑な型は、エディタで**ホバーして展開結果を見る**のが一番です。展開されずに `MyPick<User, "id">` のように表示されるときは、次のヘルパーで強制的に展開できます。

```ts
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type Check = Prettify<MyPick<User, "id">>; // ホバーすると { id: number } と表示される
```

## 課題に入る前に

課題 TS-09 では組み込み型を自作します。組み込みの `Pick` / `Readonly` / `Partial` / `ReturnType` / `Awaited` などは使用禁止です。

- **MyPick / MyReadonly / MyPartial**: Mapped Types と修飾子
- **ValueOf**: `T[keyof T]`
- **MyReturnType / UnwrapPromise / ElementOf**: `infer`。ElementOf は readonly タプルにも対応すること
- **DeepReadonly**: 再帰 + 条件型
- **Getters**: Key Remapping + `Capitalize` + テンプレートリテラル
- **KeysOfType**: 上の「キーをユニオンとして取り出すテクニック」

## 面接で聞かれたら

<details>
<summary>Q. Mapped Type <code>{ [K in keyof T]: ... }</code> の仕組みは？</summary>

`keyof T` で T のキーのユニオンを取り出し、`in` でその各キーを K としてループし、新しいオブジェクト型を作ります。値の位置で `T[K]` を使えば元のプロパティの型を参照でき、それを加工できます。`readonly` や `?` を付けたり、`-readonly` / `-?` で外したりもできます。Partial や Readonly などの組み込み型はこれで実装されています。

</details>

<details>
<summary>Q. Conditional Type の分配（distributive）とは？</summary>

`T extends U ? X : Y` の T が裸の型パラメータのとき、T にユニオン型を渡すと、ユニオンの各メンバーごとに条件が評価され、結果がユニオンにまとめられる性質です。例えば Exclude は「U に代入可能なら never、そうでなければそのまま」と書くだけで、ユニオンから特定の型を取り除けます。分配させたくない場合は `[T] extends [U]` のようにタプルで囲みます。

</details>

<details>
<summary>Q. infer は何をしていますか？</summary>

条件型の extends の右側で使い、型のパターンにマッチした部分を型変数として取り出します。例えば `T extends Promise<infer U> ? U : T` は、T が Promise の形なら中身の型を U として取り出します。ReturnType や Parameters もこの仕組みで、関数の型にマッチさせて戻り値や引数の型を取り出しています。

</details>

<details>
<summary>Q. 型レベルの処理を実務でどの程度書くべきだと思いますか？</summary>

アプリケーションのコードでは、組み込みのユーティリティ型で済むことがほとんどで、複雑な型は読める人が限られ保守コストが上がるので、必要最小限にすべきだと考えています。一方で、チーム共通の API クライアントやフォームなど、多くの場所で使われる部分では、型で誤用を防げる効果が大きいので、適切に使う価値があります。また、ライブラリの型定義や型エラーを読み解くために、仕組みを理解しておくことは重要だと思います。

</details>

## 理解度チェック

<details>
<summary>1. <code>type A = string extends "a" ? 1 : 2</code> と <code>type B = "a" extends string ? 1 : 2</code> の結果は？</summary>

A は `2`、B は `1`。`"a"` は `string` に代入できるが、`string`（あらゆる文字列）は `"a"` に代入できない。「extends = 左が右に代入可能か」と読む。

</details>

<details>
<summary>2. <code>keyof { a: 1; b: 2 }</code> と <code>{ a: 1; b: 2 }[keyof { a: 1; b: 2 }]</code> の違いは？</summary>

前者はキーのユニオン `"a" | "b"`、後者は値のユニオン `1 | 2`。

</details>
