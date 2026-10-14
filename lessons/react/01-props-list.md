# コンポーネントと props

## この章で学ぶこと

- React のコンポーネントとは何か、JSX の基本ルール
- props の受け取り方と型定義
- リストの描画と `key` の役割
- 条件付きレンダリングの書き方
- イベントハンドラの渡し方
- 単方向データフロー
- テストの読み方（Testing Library）

## コンポーネント = UI を返す関数

React のコンポーネントは、**props（入力）を受け取って、UI（JSX）を返す関数**です。

```tsx
function Greeting({ name }: { name: string }) {
  return <p>こんにちは、{name}さん</p>;
}

// 使う側
<Greeting name="Taro" />;
```

- コンポーネント名は**大文字で始める**（小文字だと HTML タグとみなされる）
- 1つの要素を返す。複数を返したいときは `<>...</>`（Fragment）で囲む

## JSX の基本ルール

JSX は HTML に似ていますが、実体は JavaScript の式です。

```tsx
const user = { name: "Taro", isAdmin: true };

<div className="card">                {/* class ではなく className */}
  <label htmlFor="email">メール</label> {/* for ではなく htmlFor */}
  <input id="email" />                   {/* 閉じタグの無い要素も /> で閉じる */}
  <p>{user.name}</p>                     {/* {} の中には JS の「式」が書ける */}
  <p>{user.isAdmin ? "管理者" : "一般"}</p>
  <p style={{ color: "red" }}>注意</p>  {/* style はオブジェクト */}
</div>;
```

`{}` の中に書けるのは**式**（値になるもの）だけで、`if` 文や `for` 文は書けません。そのため条件分岐は三項演算子や `&&`、繰り返しは `map` を使います。

## props の型を定義する

props はオブジェクトとして渡されるので、TS-02 で学んだ方法で型を書きます。

```tsx
interface UserCardProps {
  name: string;
  age: number;
  email?: string; // 省略可能な props
  onClick?: () => void; // 関数も渡せる
}

function UserCard({ name, age, email, onClick }: UserCardProps) {
  return (
    <div onClick={onClick}>
      <h3>{name}</h3>
      <p>{age}歳</p>
      {email && <p>{email}</p>}
    </div>
  );
}
```

引数で**分割代入**して受け取るのが一般的です。デフォルト値も書けます。

```tsx
function Button({ size = "medium", label }: { size?: "small" | "medium"; label: string }) {
  // ...
}
```

### children

コンポーネントのタグで囲んだ中身は `children` という props で渡されます。

```tsx
import type { ReactNode } from "react";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

<Card title="お知らせ">
  <p>本文です</p>
</Card>;
```

`ReactNode` は「JSX として描画できるもの全部」（要素、文字列、数値、null、配列など）を表す型です。

### React.FC は使う？

`const Greeting: React.FC<Props> = ({ name }) => ...` という書き方もあります。以前は `children` が暗黙に含まれる問題があり避けられていましたが、React 18 の型定義で解消されました。現在は**どちらでも良く、チームで統一すれば OK** です。この教材では普通の関数で書きます（戻り値の型を推論に任せられ、ジェネリックなコンポーネントも書きやすいため）。

## リストの描画

配列を `map` で JSX の配列に変換します。

```tsx
const fruits = [
  { id: 1, name: "りんご" },
  { id: 2, name: "バナナ" },
];

<ul>
  {fruits.map((fruit) => (
    <li key={fruit.id}>{fruit.name}</li>
  ))}
</ul>;
```

### key は何のためにある？

`key` は、React が**リストの各要素を識別するための目印**です。

React は state が変わると、新しい JSX と前回の JSX を比較して、変わった部分だけ実際の DOM を更新します（reconciliation）。リストでは、key を見て「前回のどの要素と、今回のどの要素が同じものか」を判断します。

| 前回 | 今回（先頭に追加） | key があれば |
|---|---|---|
| `key=1` りんご | `key=3` みかん | 「3 は新規。1 と 2 はそのまま」→ 1つ追加するだけ |
| `key=2` バナナ | `key=1` りんご | |
| | `key=2` バナナ | |

### index を key にしてはいけない理由

```tsx bad
{todos.map((todo, index) => (
  <li key={index}>
    <input type="checkbox" /> {todo.title}
  </li>
))}
```

先頭に要素を追加すると、すべての要素の index が1つずれます。React は「key=0 の要素は同じもの」と判断するので、**中身（テキスト）だけ差し替えて、チェックボックスの状態や入力中の文字などの内部状態は前の位置に残ったまま**になります。結果、チェックが別の行に付いているように見えるバグになります。

```tsx good
{todos.map((todo) => (
  <li key={todo.id}>...</li>
))}
```

key には**一意で、並べ替えや削除をしても変わらない値**（データベースの id など）を使います。

> **注意** key には `Math.random()` も使ってはいけません。レンダーのたびに key が変わり、毎回すべての要素が作り直されます（入力中の文字が消える、性能が落ちる）。

key は兄弟要素の中で一意であれば十分で、アプリ全体で一意である必要はありません。また key はコンポーネントの props としては渡されません（子から `props.key` は読めない）。

## 条件付きレンダリング

```tsx
// 1. 三項演算子：AかBか
{isLoggedIn ? <Dashboard /> : <Login />}

// 2. &&：条件を満たすときだけ表示
{hasError && <p className="error">エラーです</p>}

// 3. 早期 return：コンポーネント全体を切り替える
function UserList({ users }: { users: User[] }) {
  if (users.length === 0) {
    return <p>ユーザーがいません</p>;
  }
  return <ul>{/* ... */}</ul>;
}
```

> **注意** `&&` の左側が**数値の 0** だと、`0` が画面に表示されてしまいます。

```tsx bad
{items.length && <List items={items} />} {/* items が空だと「0」と表示される */}
```

```tsx good
{items.length > 0 && <List items={items} />}
```

`false` / `null` / `undefined` は何も描画されませんが、`0` は描画されます。左側は必ず boolean にしましょう。

## イベントハンドラ

```tsx
function Item({ item, onSelect }: { item: Item; onSelect: (item: Item) => void }) {
  return (
    <button type="button" onClick={() => onSelect(item)}>
      {item.name}
    </button>
  );
}
```

- `onClick={onSelect(item)}` と書くと、**レンダー中に関数が実行されてしまいます**。必ず `() => onSelect(item)` のように関数で包みます
- 引数が不要なら `onClick={handleClick}` と関数そのものを渡せます

省略可能な関数 props は、オプショナルチェーンで呼べます。

```tsx
onClick={() => onSelect?.(item)} // onSelect が undefined なら何もしない
```

### button には type を付ける

`<button>` の `type` の初期値は `"submit"` です。フォームの中にあると、クリックでフォームが送信されてしまいます。**送信ボタン以外は `type="button"` を付ける**癖をつけましょう。

## 単方向データフロー

React のデータは**親から子へ、props で一方向に流れます**。子は props を変更してはいけません。

```tsx bad
function Child(props: { count: number }) {
  props.count = 10; // 禁止（props は読み取り専用）
}
```

子から親に何かを伝えたいときは、**親から関数を props で渡し、子はそれを呼ぶ**だけです。

```text
親（データを持つ）
  │  props: users, onSelect
  ▼
子（表示して、クリックされたら onSelect(user) を呼ぶ）
```

データを変更できるのは「データを持っている人（親）」だけなので、どこで何が変わったかを追いやすくなります。

## テストの読み方：Testing Library

React の課題では Testing Library でテストしています。テストを読めると、課題の要求が正確にわかります。

```tsx
render(<UserList users={users} />); // コンポーネントを描画

screen.getByRole("heading", { name: "ユーザー一覧（3人）" }); // 見出しを探す
screen.getAllByRole("listitem"); // li を全部探す
screen.getByRole("button", { name: "佐藤" }); // テキストが「佐藤」のボタン
screen.getByText("管理者"); // テキストで探す
screen.getByLabelText("メールアドレス"); // label で入力欄を探す（R-03）

await userEvent.click(button); // ユーザーのクリックを再現
```

Testing Library は「**ユーザーから見えるもの**」で要素を探します。`role` は HTML の意味（`<button>` は button、`<li>` は listitem、`<h1>`〜`<h6>` は heading）です。

- `getBy...`: 見つからなければエラー
- `queryBy...`: 見つからなければ `null`（「無いこと」の確認に使う）
- `findBy...`: 見つかるまで待つ（非同期）

つまり、**正しい HTML 要素を使えば、テストもアクセシビリティも自然に満たせる**ということです。`<div onClick>` でボタンを作ると、`getByRole("button")` では見つかりません。

## 課題に入る前に

- props の型（`UserListProps`）を自分で定義する。`onSelect` は省略可能
- 見出しは空のときも表示する。リストと「ユーザーがいません」を三項演算子で切り替える
- 「管理者」バッジは、ボタンの**外**に置く（ボタンのテキストはユーザー名だけ、というテストがあるため）
- key は `user.id`

## 面接で聞かれたら

<details>
<summary>Q. key はなぜ必要？ index を key にすると何が起きますか？</summary>

key は、再レンダー時に React がリストの各要素を前回の要素と対応付けるための目印です。key が同じなら同じ要素とみなして、DOM や内部状態を再利用します。index を key にすると、先頭への追加や並べ替え・削除で index がずれるため、別のデータなのに同じ要素とみなされ、入力中の値やチェック状態などが別の行に残るバグが起きます。key にはデータの id など、一意で変わらない値を使います。

</details>

<details>
<summary>Q. props を子が変更してはいけないのはなぜですか？</summary>

React は親から子へ一方向にデータが流れる設計で、データはそれを持っているコンポーネントだけが変更する、というルールにすることで、どこで状態が変わったかを追いやすくしています。子が props を書き換えても React は再レンダーを起こさないので画面とデータがずれますし、親のデータを壊すことにもなります。子から変更したい場合は、親から変更用の関数を props で受け取り、それを呼びます。

</details>

<details>
<summary>Q. <code>onSelect?.(user)</code> の <code>?.</code> は何ですか？</summary>

オプショナルチェーンです。onSelect が null か undefined なら呼び出しをせず undefined を返し、関数があれば呼び出します。省略可能な関数 props を安全に呼ぶときに使います。

</details>

<details>
<summary>Q. React.FC を使う派ですか？</summary>

どちらでも良いと思っていて、チームで統一することが大事だと考えています。以前は React.FC に children が暗黙で含まれる問題がありましたが、React 18 で解消されました。私は普通の関数で props に型を付ける書き方をよく使います。ジェネリックなコンポーネントが書きやすく、関数宣言なら巻き上げも効くからです。

</details>

## 理解度チェック

<details>
<summary>1. <code>{count && &lt;p&gt;{count}件&lt;/p&gt;}</code> で count が 0 のとき何が表示される？</summary>

`0` という文字が表示されます。`0 && ...` は `0` を返し、React は数値の 0 を描画するからです。`count > 0 && ...` と書きます。

</details>

<details>
<summary>2. <code>&lt;button onClick={handleDelete(id)}&gt;</code> の問題は？</summary>

レンダーのたびに `handleDelete(id)` が実行され、その戻り値（たぶん undefined）が onClick に渡されます。クリックでは何も起きず、表示しただけで削除が走ります。`onClick={() => handleDelete(id)}` と書きます。

</details>
