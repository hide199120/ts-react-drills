# ユーティリティ型

## この章で学ぶこと

- 「型を導出する」という考え方（Single Source of Truth）
- オブジェクトを加工する型：`Pick` / `Omit` / `Partial` / `Required` / `Readonly` / `Record`
- ユニオンを加工する型：`Exclude` / `Extract` / `NonNullable`
- 関数から型を取り出す：`typeof` / `ReturnType` / `Parameters` / `Awaited`
- 実務でのよくある使い方

## なぜ型を「導出」するのか

Todo アプリで、次のような型が必要になったとします。

```ts bad
interface Todo {
  id: number;
  title: string;
  done: boolean;
  createdAt: Date;
}

// 新規作成フォームの入力（id と createdAt はサーバーが付ける）
interface TodoInput {
  title: string;
  done: boolean;
}

// 一覧表示用
interface TodoListItem {
  id: number;
  title: string;
}
```

これで動きますが、`Todo` に `priority` を追加したとき、`TodoInput` にも追加し忘れるかもしれません。`title` を `name` に変えたら3か所直す必要があります。**同じ情報が複数の場所に書かれている**のが問題です。

ユーティリティ型を使うと、元の型から**導出**できます。

```ts good
type TodoInput = Omit<Todo, "id" | "createdAt">;
type TodoListItem = Pick<Todo, "id" | "title">;
```

`Todo` を変更すれば、派生した型も自動的に追従します。これを **Single Source of Truth（信頼できる唯一の情報源）** と呼びます。

## オブジェクト型を加工する

以下、この型を例にします。

```ts
interface User {
  id: number;
  name: string;
  email?: string;
  role: "admin" | "member";
}
```

### Pick / Omit：プロパティを選ぶ・除く

```ts
type UserName = Pick<User, "id" | "name">;
// { id: number; name: string }

type UserWithoutId = Omit<User, "id">;
// { name: string; email?: string; role: "admin" | "member" }
```

どちらを使うかは「残したいもののほうが少ないか、除きたいもののほうが少ないか」で決めると読みやすくなります。

> **注意** `Omit` は、**存在しないキーを指定してもエラーになりません**（`Omit<User, "idd">` はタイプミスでも通る）。キーの型が `keyof any`（= `string | number | symbol`）だからです。`Pick` は `K extends keyof T` なので存在しないキーはエラーになります。

### Partial / Required：任意・必須を切り替える

```ts
type UserPatch = Partial<User>;
// { id?: number; name?: string; email?: string; role?: ... }

type CompleteUser = Required<User>;
// { id: number; name: string; email: string; role: ... }  ← email も必須に
```

`Partial` は「更新用の型」（一部のプロパティだけ渡す）でよく使います。

### Readonly：読み取り専用にする

```ts
type FrozenUser = Readonly<User>;
// { readonly id: number; readonly name: string; ... }
```

関数の引数を `Readonly<T>` や `readonly T[]` にすると、「この関数は引数を変更しない」ことを型で約束できます。

### Record：キーと値の型を指定した辞書

```ts
type UserById = Record<number, User>;

type RoleLabel = Record<User["role"], string>;
// { admin: string; member: string }

const labels: RoleLabel = { admin: "管理者", member: "一般" };
// member を書き忘れるとエラー → 選択肢を増やしたときの対応漏れを防げる
```

キーにユニオン型を渡すと、**すべてのキーが必須**になります。選択肢ごとのラベルや色などを定義するときに便利です。

### 組み合わせる

ユーティリティ型は入れ子にできます。

```ts
// id 以外を任意にした更新用の型
type UserUpdate = Partial<Omit<User, "id">>;

// id は必須、それ以外は任意
type UserUpdateWithId = Pick<User, "id"> & Partial<Omit<User, "id">>;
```

内側から読むのがコツです。`Partial<Omit<User, "id">>` は「User から id を除いて」→「全部任意にする」。

## ユニオン型を加工する

### Exclude / Extract

```ts
type Status = "todo" | "doing" | "done" | "archived";

type ActiveStatus = Exclude<Status, "archived">; // "todo" | "doing" | "done"
type Finished = Extract<Status, "done" | "archived">; // "done" | "archived"
```

**`Omit` はオブジェクトのキーを除く、`Exclude` はユニオンから型を除く**。名前が似ていて混同しやすいので注意しましょう。

### NonNullable

```ts
type MaybeName = string | null | undefined;
type Name = NonNullable<MaybeName>; // string
```

## 値から型を取り出す

### typeof（型の文脈）

JavaScript の `typeof` は実行時に `"string"` などの文字列を返す演算子ですが、**型の位置に書くと「その値の型」を取り出す**意味になります。

```ts
const config = {
  apiUrl: "https://example.com",
  timeout: 5000,
};

type Config = typeof config; // { apiUrl: string; timeout: number }

// 値の世界の typeof（実行時）
if (typeof config.timeout === "number") {
}
```

同じキーワードが、書く場所によって別の意味になる点は面接でも聞かれます。

### ReturnType / Parameters

関数の型から、戻り値や引数の型を取り出せます。

```ts
function createUser(name: string, age: number) {
  return { id: Math.random(), name, age };
}

type NewUser = ReturnType<typeof createUser>; // { id: number; name: string; age: number }
type CreateUserArgs = Parameters<typeof createUser>; // [name: string, age: number]
type FirstArg = Parameters<typeof createUser>[0]; // string
```

`typeof createUser` で「関数の型」を取り出してから渡すのがポイントです。`ReturnType<createUser>` とは書けません（createUser は値であって型ではないため）。

`Parameters` はタプル型を返すので、`[0]` `[1]` で N 番目の引数の型を取れます。オプショナル引数なら `| undefined` が付きます。

### Awaited

`async` 関数の戻り値は `Promise<...>` です。中身の型が欲しいときは `Awaited` を使います。

```ts
async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return (await res.json()) as { id: number; name: string };
}

type R = ReturnType<typeof fetchUser>; // Promise<{ id: number; name: string }>
type U = Awaited<ReturnType<typeof fetchUser>>; // { id: number; name: string }
```

> **ポイント** 外部ライブラリが型を export していないとき、`ReturnType` や `Parameters` で関数から型を取り出すと、ライブラリの型定義に追従したまま使えます。実務でかなり便利です。

## よく使うパターン集

```ts
// API レスポンスとフォーム入力
type UserResponse = User;
type UserForm = Omit<User, "id">;
type UserUpdateRequest = Partial<UserForm>;

// コンポーネントの props を別コンポーネントから流用（React）
type ButtonProps = React.ComponentProps<"button">;
type MyButtonProps = Omit<ButtonProps, "onClick"> & { onPress: () => void };

// 選択肢の一覧から型を作る（R-04 で使う）
const FILTERS = ["all", "active", "done"] as const;
type Filter = (typeof FILTERS)[number]; // "all" | "active" | "done"
```

最後のパターンは、`as const` で配列をリテラル型のタプルにし、`[number]`（任意のインデックス）で要素の型のユニオンを取り出しています。**「値の一覧」と「型」を1か所で管理できる**ので、セレクトボックスの選択肢などでよく使われます。

## 課題に入る前に

課題 TS-06 は型だけの課題です。11 個の型を、それぞれユーティリティ型で導出してください。

- `Todo` を手でコピーして書き直すのは禁止。必ず `Todo` から導出する
- 8 と 9 は `typeof fetchTodo` から導出する
- 7 の priority の型は `Todo["priority"]` で取り出せる
- 結果の型はエディタでホバーすると確認できます。期待する形と見比べながら進めましょう

## 面接で聞かれたら

<details>
<summary>Q. Pick と Omit の使い分けは？ Omit の欠点は？</summary>

残したいプロパティが少ないなら Pick、除きたいプロパティが少ないなら Omit を使うと読みやすくなります。Omit の欠点は、キーが `keyof T` に制約されていないので、存在しないキーやタイプミスを指定してもエラーにならないことです。元の型からプロパティが削除・リネームされても気づけません。

</details>

<details>
<summary>Q. typeof は型の世界と値の世界で意味が違います。それぞれ何ですか？</summary>

値の世界（式の中）の typeof は JavaScript の演算子で、実行時に `"string"` や `"object"` などの文字列を返します。型の世界（型注釈の位置）の typeof は TypeScript の機能で、変数や関数の型を取り出します。例えば `type Config = typeof config` のように、値から型を作るときに使います。

</details>

<details>
<summary>Q. API レスポンスの型と、フォーム入力の型を別に定義するのはなぜですか？</summary>

持つべきデータが違うからです。レスポンスには id や作成日時などサーバーが付ける項目がありますが、フォームではユーザーが入力しない項目は不要です。逆にフォームには確認用パスワードのような送信しない項目があることもあります。1つの型を使い回すと、オプショナルだらけになって型の意味が弱くなります。ただし別々に手書きすると同期がずれるので、Omit や Pick で元の型から導出するのが良いと考えています。

</details>

## 理解度チェック

<details>
<summary>1. <code>Partial&lt;User&gt;</code> はネストしたオブジェクトの中まで任意になる？</summary>

なりません。`Partial` は1階層目のプロパティだけを任意にします（浅い）。ネストまで任意にしたい場合は、TS-09 で作る `DeepPartial` のような再帰的な型が必要です。

</details>

<details>
<summary>2. <code>Record&lt;string, User&gt;</code> と <code>{ [key: string]: User }</code> の違いは？</summary>

意味は同じです（インデックスシグネチャ）。`Record` のほうが短く、キーにユニオン型を渡して「全キー必須」にもできるので、よく使われます。

</details>
