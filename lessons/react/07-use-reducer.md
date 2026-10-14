# useReducer

## この章で学ぶこと

- reducer とは：`(現在の状態, 起きたこと) => 次の状態`
- `useReducer` の使い方と型
- Action を判別可能なユニオンで設計する
- reducer を純粋関数にする理由
- selector：派生データを計算する関数
- useState と useReducer の使い分け
- Redux / Zustand との関係

## 状態更新のロジックが散らばる問題

ショッピングカートを useState で書くと、こうなります。

```tsx
function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      return exists
        ? prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...product, quantity: 1 }];
    });
  };
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const changeQuantity = (id: string, q: number) => {
    /* ... */
  };
  // ...さらに JSX が続く
}
```

動きはしますが、

- 「カートがどう変化しうるか」のロジックが、コンポーネントの中のあちこちのハンドラに散らばっている
- テストするにはコンポーネントを描画してボタンを押すしかない
- 同じ操作を別の場所からもしたいとき、ロジックを使い回しにくい

`useReducer` は、**「状態がどう変わるか」のロジックを、コンポーネントの外の1つの関数にまとめる**仕組みです。

## reducer の考え方

reducer は次の形の関数です。

```ts
function reducer(state: State, action: Action): State {
  // 現在の状態と「何が起きたか」から、次の状態を計算して返す
}
```

- **state**: 現在の状態
- **action**: 何が起きたかを表すオブジェクト（例: `{ type: "add", product }`）
- 戻り値: 次の状態

名前の由来は配列の `reduce`（TS-03）です。`actions.reduce(reducer, initialState)` とすると、起きたことを順番に適用した最終状態が得られます。

## useReducer の使い方

```tsx
import { useReducer } from "react";

type State = { count: number };
type Action = { type: "increment" } | { type: "decrement" } | { type: "reset"; value: number };

function counterReducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "reset":
      return { count: action.value };
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0 });

  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "reset", value: 0 })}>リセット</button>
    </>
  );
}
```

- `useReducer(reducer, 初期状態)` は `[state, dispatch]` を返す
- `dispatch(action)` を呼ぶと、React が `reducer(現在の state, action)` を実行し、戻り値を次の state にして再レンダーする
- コンポーネントは「何が起きたか」を dispatch するだけで、「どう変わるか」は知らない

## Action を判別可能なユニオンで設計する

Action は、TS-05 の判別可能なユニオンにするのが定番です。`type` プロパティが判別子になります。

```ts
type CartAction =
  | { type: "add"; product: Product }
  | { type: "remove"; productId: string }
  | { type: "clear" };
```

こうすると、

- reducer の `switch (action.type)` の各 case で、action のプロパティが正しく絞り込まれる（`case "add"` の中でだけ `action.product` が使える）
- dispatch するときに、必要なプロパティの書き忘れや、存在しない type をコンパイル時に検出できる
- `default` で `assertNever` を使えば、Action を追加したときの reducer の対応漏れも検出できる

```tsx
dispatch({ type: "add" }); // エラー: product が無い
dispatch({ type: "ad", product }); // エラー: 存在しない type
```

### Action の名前は「何が起きたか」で

Action は「state をこうしろ」という命令（`setItems`）より、「**何が起きたか**」（`add`, `itemRemoved`, `checkoutCompleted`）で名付けると、ロジックが reducer に集まりやすくなります。

### case の中で変数を宣言するとき

```ts
switch (action.type) {
  case "add": {
    // 波括弧でブロックを作る
    const exists = state.items.some((i) => i.id === action.product.id);
    // ...
  }
}
```

`case` の中で `const` を使うときは、`{}` で囲んでスコープを分けます（囲まないと、別の case と変数名が衝突したときにエラーになる）。

## reducer は純粋関数にする

reducer は**純粋関数**でなければなりません。

- 同じ引数なら、必ず同じ結果を返す
- 引数（state, action）を変更しない
- 副作用（API 呼び出し、localStorage、乱数、現在時刻、console 以外の外部への影響）を持たない

```ts bad
case "add":
  state.items.push({ ...action.product, quantity: 1 }); // state を直接変更
  return state; // 同じ参照なので再レンダーもされない
```

```ts good
case "add":
  return { ...state, items: [...state.items, { ...action.product, quantity: 1 }] };
```

なぜ純粋でなければならないのか。

1. **React の前提**: 開発時の StrictMode では、純粋かどうかを確かめるために reducer が**2回呼ばれます**。副作用があると2回実行されてしまう
2. **テストが簡単**: 入力と出力だけで確認できる。React も DOM も不要
3. **予測可能**: 状態がどう変わるかは、reducer だけを読めばわかる

API 呼び出しなどの副作用は、イベントハンドラや useEffect で行い、その結果を dispatch します。

```tsx
const handleCheckout = async () => {
  dispatch({ type: "checkoutStarted" });
  try {
    await api.checkout(state.items); // 副作用はハンドラで
    dispatch({ type: "checkoutSucceeded" });
  } catch {
    dispatch({ type: "checkoutFailed" });
  }
};
```

### reducer を単体テストする

```ts
test("add: 既存の商品は数量 +1", () => {
  const state = { items: [{ ...apple, quantity: 1 }] };
  const next = cartReducer(state, { type: "add", product: apple });
  expect(next.items[0].quantity).toBe(2);
  expect(state.items[0].quantity).toBe(1); // 元は変わっていない
});
```

課題 R-07 のテストもこの形で書かれています。

## selector：派生データを計算する

「合計金額」「合計点数」は state から計算できるので、state には持ちません（R-04 の派生データ）。計算する関数を **selector** として切り出すと、複数の場所で使い回せてテストもしやすくなります。

```ts
export const selectTotalCount = (state: CartState) => state.items.reduce((sum, i) => sum + i.quantity, 0);

// コンポーネント
<p>{selectTotalCount(cart)}点</p>;
```

Redux でもこの「state は最小限、表示用の値は selector で計算」という設計が推奨されています。

## 数値の表示

金額の3桁区切りは `toLocaleString` で簡単にできます。

```ts
(1500).toLocaleString(); // "1,500"
(1500).toLocaleString("ja-JP", { style: "currency", currency: "JPY" }); // "￥1,500"
```

## useState と useReducer の使い分け

| useState が向いている | useReducer が向いている |
|---|---|
| 独立した単純な値（入力文字、開閉フラグ） | 複数の値が連動して変わる |
| 更新方法が「値をセットする」だけ | 更新の種類が多い（追加・削除・変更・リセット…） |
| ロジックが短い | 次の状態の計算ロジックが複雑 |
| | 更新ロジックを単体テストしたい |

迷ったら useState で始めて、ハンドラが増えて更新ロジックが複雑になってきたら useReducer に移行する、で十分です。なお、内部的には useState も useReducer で実装されています。

## Redux / Zustand との関係

**Redux** は、この reducer + dispatch の考え方を**アプリ全体の状態**に広げたライブラリです。useReducer は「1つのコンポーネント内の Redux」と言えます。現在は **Redux Toolkit**（RTK）が公式の推奨で、ボイラープレートが大幅に減り、Immer により「直接変更しているように書けるが、実際はイミュータブルに更新される」書き方ができます。

**Zustand** は、よりシンプルなグローバル状態管理ライブラリで、reducer や Action の型を定義せずに、関数で状態を更新できます。

| | 解決すること |
|---|---|
| useReducer | 1コンポーネント内の複雑な状態更新ロジックの整理 |
| Context + useReducer | 中規模のアプリで、ツリーの離れた場所と状態を共有（R-08） |
| Redux Toolkit | 大規模なアプリの状態管理。開発ツール（タイムトラベルデバッグ）、ミドルウェア |
| Zustand / Jotai | 少ないコードでのグローバル状態。必要な部分だけ再レンダー |

サーバーから取得したデータ（サーバー state）は TanStack Query などに任せ（R-05）、**クライアントだけの状態**（UI の開閉、フォームの途中入力、カートなど）を上の手段で管理する、という分担が現在の主流です。

## 課題に入る前に

- **CartAction**: 4種類の Action を判別可能なユニオンで
- **cartReducer**: `add` は「既にあれば map で数量 +1、なければ末尾に追加」。`setQuantity` で 0 以下なら削除（`remove` と同じ処理を再利用できます）
- **selectors**: `reduce` で合計
- **Cart**: `useReducer(cartReducer, { items: [] })` で、ボタンから dispatch するだけ。カートの `<ul>` には `aria-label="カート"` を付ける
- 元の state を変更していないかもテストされます

## 面接で聞かれたら

<details>
<summary>Q. useState と useReducer の使い分けは？</summary>

独立した単純な値で、更新が「値をセットするだけ」なら useState を使います。複数の値が連動して変わる、更新の種類が多い、次の状態を決めるロジックが複雑、といった場合は useReducer を使います。更新ロジックがコンポーネントの外の純粋な関数にまとまるので、見通しが良くなり、React なしで単体テストもできます。最初は useState で書いて、複雑になってきたら移行することが多いです。

</details>

<details>
<summary>Q. reducer を純粋関数にする理由は？</summary>

React は reducer が純粋であることを前提にしていて、開発時の StrictMode では検証のために reducer を2回呼びます。副作用があると二重に実行されてしまいます。また、純粋関数なら入力と出力だけでテストでき、状態の変化を予測しやすくなります。state を直接変更すると、参照が変わらず再レンダーされないという問題もあります。副作用はイベントハンドラや useEffect で行い、その結果を dispatch します。

</details>

<details>
<summary>Q. Redux との関係は？ Redux Toolkit や Zustand は何を解決しますか？</summary>

useReducer は Redux と同じ reducer と dispatch の考え方を、1つのコンポーネントの中で使うものです。Redux はそれをアプリ全体の状態に広げ、どこからでも状態を読んで dispatch でき、開発ツールで状態の変化を追跡できます。Redux Toolkit は従来の Redux の冗長な記述を減らし、Immer で簡潔に更新を書けるようにした公式推奨のツールです。Zustand はさらにシンプルなグローバル状態管理で、少ないコードで状態を共有でき、必要な部分だけが再レンダーされるように購読できます。

</details>

## 理解度チェック

<details>
<summary>1. reducer の中で <code>id: crypto.randomUUID()</code> を生成するのは良い？</summary>

良くありません。乱数を使うと同じ引数で結果が変わるので、純粋関数ではなくなります（StrictMode で2回呼ばれると別の id になる）。id はイベントハンドラで生成して、action に含めて渡します: `dispatch({ type: "add", id: crypto.randomUUID(), title })`。

</details>

<details>
<summary>2. dispatch 関数は useEffect の依存配列に入れる必要がある？</summary>

入れても入れなくても動きます。dispatch は setState と同じく、React が参照の安定を保証しているので、レンダーをまたいでも同じ関数です。lint のルール上も省略が許されています。

</details>
