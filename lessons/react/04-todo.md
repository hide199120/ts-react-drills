# 配列 state と派生データ

## この章で学ぶこと

- 配列 state の追加・更新・削除をイミュータブルに書く
- React が「変わった」と判断する仕組み（参照の比較）
- 派生データ（計算で出せる値）を state にしない
- state の置き場所を決める（どのコンポーネントが持つか）
- id の生成方法
- `as const` で選択肢と型を一元管理する

Todo アプリは React の基本がすべて詰まった題材で、面接のライブコーディングでも定番です。

## React は「参照」で変化を判断する

```tsx bad
const [todos, setTodos] = useState<Todo[]>([]);

const add = (title: string) => {
  todos.push({ id: "1", title, done: false }); // 配列そのものを変更
  setTodos(todos); // 同じ配列を渡している
};
```

これは**画面が更新されません**。React は `setTodos` に渡された値が前の値と同じかどうかを `Object.is`（ほぼ `===`）で比べ、**同じなら再レンダーをスキップ**します。`push` で中身を変えても配列の参照は同じなので、「変わっていない」と判断されます。

TS-02 で学んだ「イミュータブルな更新」がここで効いてきます。**新しい配列を作って渡す**のが正解です。

## 追加・更新・削除のパターン

この3つは丸暗記してよいほど頻出です。

```tsx
interface Todo {
  id: string;
  title: string;
  done: boolean;
}

// 追加：末尾に足した新しい配列
setTodos((prev) => [...prev, newTodo]);
setTodos((prev) => [newTodo, ...prev]); // 先頭に追加

// 更新：map で該当する要素だけ新しいオブジェクトに置き換える
setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

// 削除：filter で該当する要素を除く
setTodos((prev) => prev.filter((t) => t.id !== id));
```

更新のパターンを分解すると、

- `prev.map(...)` で新しい配列を作る
- 対象の要素は `{ ...t, done: !t.done }` で**要素も新しいオブジェクトにする**
- 対象でない要素は `t` をそのまま返す（参照を変えない）

> **注意** `prev.map((t) => { if (t.id === id) t.done = !t.done; return t; })` は、配列は新しくなりますが、**要素のオブジェクトを直接書き換えています**。R-09 で学ぶ `React.memo` が効かなくなったり、前の state が壊れたりします。要素も必ずコピーしましょう。

### 禁止リスト

state に対して使ってはいけない操作です（TS-03 の破壊的メソッド）。

| ✕ 使わない | ○ 代わりに |
|---|---|
| `push` / `unshift` | `[...prev, x]` / `[x, ...prev]` |
| `splice` | `filter` / `slice` |
| `sort` / `reverse` | `toSorted` / `toReversed` / `[...prev].sort()` |
| `prev[i] = x` | `map` / `prev.with(i, x)` |
| `t.done = true` | `{ ...t, done: true }` |

## 派生データを state にしない

「未完了の件数」や「フィルタ後のリスト」を state で持ちたくなるかもしれません。

```tsx bad
const [todos, setTodos] = useState<Todo[]>([]);
const [remaining, setRemaining] = useState(0); // todos から計算できる
const [visibleTodos, setVisibleTodos] = useState<Todo[]>([]); // todos と filter から計算できる

const toggle = (id: string) => {
  setTodos(/* ... */);
  setRemaining(/* ... */); // 毎回忘れずに同期させる必要がある
  setVisibleTodos(/* ... */);
};
```

これには大きな問題があります。

- 更新のたびに**すべてを同期させる必要があり、1か所でも忘れるとズレる**
- 削除・追加・フィルタ変更…と、更新する場所が増えるほどバグの可能性が増える

**計算で出せる値は、レンダー中に計算します**。

```tsx good
const [todos, setTodos] = useState<Todo[]>([]);
const [filter, setFilter] = useState<Filter>("all");

// レンダーのたびに計算する（常に todos と filter に一致する）
const remaining = todos.filter((t) => !t.done).length;
const visibleTodos = todos.filter((t) => {
  if (filter === "active") return !t.done;
  if (filter === "completed") return t.done;
  return true;
});
```

コンポーネント関数は state が変わるたびに再実行されるので、この計算も毎回最新の state で行われ、**絶対にズレません**。これを **Single Source of Truth**（TS-06 と同じ考え方）と呼びます。

> **ポイント** state を追加する前に「これは他の state や props から計算できないか？」と考える癖をつけましょう。state は少ないほどバグが減ります。

### 計算が重かったら？

数千件程度のフィルタなら、毎回計算しても問題ありません。本当に重い計算だけ `useMemo` でキャッシュします（R-09）。**最初から useMemo を付ける必要はありません**。

## state の置き場所

「この state をどのコンポーネントが持つか」は React の設計で一番大事な判断です。基本ルールは、

> **その state を使うすべてのコンポーネントの、最も近い共通の親に置く**

例えば Todo アプリを分割すると、

```text
TodoApp          ← todos と filter を持つ
├── TodoForm     ← 入力中の文字だけ持つ。追加時に onAdd(title) を呼ぶ
├── FilterBar    ← filter と onChange を props で受け取る
├── TodoList     ← visibleTodos と onToggle / onDelete を受け取る
│   └── TodoItem
└── Footer       ← remaining を受け取る
```

`todos` は TodoList（表示）と Footer（件数）と TodoForm（追加）の全員が関係するので、共通の親である TodoApp に置きます。一方、入力欄の文字は TodoForm の中だけで使うので、TodoForm に閉じ込めます。この「state を親に持ち上げること」を **state のリフトアップ（lifting state up）** と呼びます。

課題は1コンポーネントで書いて構いませんが、この分割を意識すると読みやすいコードになります。

## id の生成

新しい Todo には一意な id が必要です（key に使うため）。

```tsx
crypto.randomUUID(); // "3b241101-e2bb-4255-8caf-4136c566a962"（ブラウザ標準）
```

| 方法 | 注意点 |
|---|---|
| `crypto.randomUUID()` | 推奨。ほぼ確実に一意。HTTPS か localhost でのみ使える |
| `Date.now()` | 同じミリ秒に2つ作ると重複する |
| `Math.random()` | 重複の可能性がゼロではない。数値で扱いにくい |
| 連番カウンター | ページをリロードすると重複しうる。サーバーと整合が取れない |

実務では、**サーバーが発行した id を使う**のが基本です。クライアントで作る id は、保存前の一時的なものと考えましょう。

## as const で選択肢と型をまとめる

フィルタのボタンのように「選択肢の一覧」と「その型」が両方必要なとき、TS-06 のテクニックが使えます。

```tsx
const FILTERS = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "completed", label: "完了" },
] as const;

type Filter = (typeof FILTERS)[number]["value"]; // "all" | "active" | "completed"

// ボタンの描画にもそのまま使える
{FILTERS.map((f) => (
  <button key={f.value} onClick={() => setFilter(f.value)}>
    {f.label}
  </button>
))}
```

選択肢を追加するときは配列に1行足すだけで、型もボタンも自動で増えます。

### aria-pressed

「選択中のボタン」を表すには `aria-pressed` を使います。

```tsx
<button aria-pressed={filter === f.value}>...</button>
```

見た目（CSS）だけでなく、スクリーンリーダーにも「押された状態」が伝わります。CSS でも `button[aria-pressed="true"]` でスタイルを当てられるので、別途 `className` を切り替える必要がありません。

## チェックボックスとラベル

```tsx
<li key={todo.id}>
  <label>
    <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
    {todo.title}
  </label>
  <button type="button" aria-label={`${todo.title}を削除`} onClick={() => remove(todo.id)}>
    ×
  </button>
</li>
```

- `<label>` で囲むと、タイトルをクリックしてもチェックが切り替わる
- 「×」のようなアイコンだけのボタンは、`aria-label` で何のボタンか説明する。「削除」ボタンが10個並んでいても、スクリーンリーダーで区別できる

## 課題に入る前に

- state は `todos`、`filter`、入力中の `text` の3つで足ります。表示用のリストと残り件数は計算で
- 追加は `<form onSubmit>` で（Enter キーでも追加できる）。`trim()` して空なら何もしない
- 追加・切り替え・削除は、この章のパターンをそのまま使えます
- `initialTodos` は `useState` の初期値に。props の配列を直接変更しないこと（テストで検査しています）

## 面接で聞かれたら

<details>
<summary>Q. なぜ state をイミュータブルに更新する必要があるのですか？</summary>

React は setState に渡された値を前の値と Object.is で比較し、同じなら再レンダーをスキップするからです。push などで配列やオブジェクトの中身を直接変更しても参照は同じなので、変更が検知されず画面が更新されません。また、React.memo や useMemo の依存比較も参照で行われるので、直接変更すると最適化も正しく動きません。前の状態が残ることで、変更の追跡や元に戻す機能も実装しやすくなります。

</details>

<details>
<summary>Q. 派生データを state にすると何が問題ですか？</summary>

元の state と派生した state を常に同期させる必要があり、更新処理のどこかで同期を忘れると表示がずれるバグになります。他の state や props から計算できる値は、レンダー中に計算すれば常に正しい値になります。計算が重い場合だけ useMemo でキャッシュします。state は必要最小限にし、情報源を1つにすることが大事です。

</details>

<details>
<summary>Q. id の生成に Date.now() / Math.random() / crypto.randomUUID() を使う場合の注意点は？</summary>

Date.now() は同じミリ秒内に複数作ると重複します。Math.random() も重複の可能性があり、文字列化の扱いも面倒です。crypto.randomUUID() は実用上一意で推奨ですが、HTTPS か localhost などの安全なコンテキストでしか使えません。いずれにしても、永続化するデータの id はサーバーが発行するのが基本で、クライアントで作る id は保存前の一時的な識別用と考えています。

</details>

## 理解度チェック

<details>
<summary>1. <code>setTodos([...todos].sort(byTitle))</code> と <code>setTodos(todos.sort(byTitle))</code> の違いは？</summary>

後者は state の配列そのものを並べ替えて、同じ参照を set しているので再レンダーされません（しかも前の state を壊しています）。前者はコピーしてから並べ替えた新しい配列なので正しく動きます。`todos.toSorted(byTitle)` でも OK。なお「表示だけ並べ替えたい」なら state は変えず、レンダー中に並べ替えた配列を作るのが良い設計です。

</details>

<details>
<summary>2. 「選択中の Todo」を state で持つとき、Todo オブジェクトと id のどちらを持つべき？</summary>

id を持つべきです。オブジェクトを持つと、todos 側でその Todo が更新されたとき、選択中のオブジェクトは古いまま残ってしまいます（情報源が2つになる）。id だけ持ち、表示時に `todos.find((t) => t.id === selectedId)` で引けば常に最新です。

</details>
