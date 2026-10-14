# useState と再レンダー

## この章で学ぶこと

- state とは何か、普通の変数ではダメな理由
- `useState` の使い方と型
- 再レンダーの仕組み
- **state はスナップショット**：更新直後に値が変わらない理由
- 関数型アップデート `setX(prev => ...)`
- イベントハンドラと副作用の置き場所

この章の「スナップショット」の考え方は、React で一番つまずきやすく、面接でも一番よく聞かれるポイントです。

## 普通の変数ではダメな理由

```tsx bad
function Counter() {
  let count = 0;
  return <button onClick={() => count++}>{count}</button>; // 押しても表示が変わらない
}
```

理由は2つです。

1. 変数を変更しても、React は**再レンダー（関数の再実行）をしない**
2. 仮に再レンダーされても、関数が再実行されるたびに `let count = 0` で初期化される

React に「この値を覚えておいて、変わったら画面を更新して」と頼むのが `useState` です。

## useState の基本

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // [現在の値, 更新関数] = useState(初期値)

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

- `count`: 現在の値
- `setCount(新しい値)`: 値を更新し、**再レンダーを予約する**
- 初期値は**最初のレンダーでだけ**使われる

### 型

初期値から推論されます。推論できない・広げたいときは型引数で指定します。

```tsx
const [count, setCount] = useState(0); // number
const [name, setName] = useState(""); // string
const [user, setUser] = useState<User | null>(null); // null だけだと null 型になるので明示
const [items, setItems] = useState<string[]>([]); // [] だけだと never[] になるので明示
```

## 再レンダーの流れ

`setCount(1)` を呼ぶと、次のことが起きます。

1. React が「count を 1 にする」という更新をキューに積む
2. イベントハンドラが終わった後、React がコンポーネント関数を**もう一度実行**する（再レンダー）
3. 今度の `useState(0)` は初期値ではなく、覚えておいた `1` を返す
4. 返された JSX と前回の JSX を比較し、違う部分だけ DOM を更新する

コンポーネント関数は**何度も実行される**もので、毎回「その時点の state で UI を計算する」関数だと考えましょう。

> **ポイント** `UI = f(state)`。React の基本思想は、「state が決まれば UI が決まる」です。DOM を直接操作するのではなく、state を変えて React に描画を任せます。

## state はスナップショット

ここが最重要ポイントです。

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    console.log(count); // 0 ← 1 ではない！
  };
  // ...
}
```

`setCount` を呼んでも、**今実行中のこの関数の中の `count` は変わりません**。`count` はこのレンダー時点の値を持つ、ただの定数（`const`）です。新しい値は**次のレンダー**で、新しい `count` として渡されます。

各レンダーは、その時点の state を「撮影」したスナップショットのようなものです。イベントハンドラはそのスナップショットの値をクロージャ（TS-02）で閉じ込めています。

### 3回呼んでも +1 にしかならない

```tsx bad
const handleClick = () => {
  setCount(count + 1); // setCount(0 + 1)
  setCount(count + 1); // setCount(0 + 1)
  setCount(count + 1); // setCount(0 + 1)
};
// 結果は 1
```

3回とも「このレンダーの count（= 0）+ 1」なので、3回とも「1 にする」という同じ指示になります。

### 関数型アップデート

**前の state を元に次の state を計算する**ときは、値ではなく関数を渡します。

```tsx good
const handleClick = () => {
  setCount((c) => c + 1); // 0 → 1
  setCount((c) => c + 1); // 1 → 2
  setCount((c) => c + 1); // 2 → 3
};
// 結果は 3
```

React は更新関数をキューに積み、**前の更新の結果を次の関数の引数に渡して**順番に実行します。

| 呼び出し | キュー | 実行時の引数 → 結果 |
|---|---|---|
| `setCount(c => c + 1)` | c => c + 1 | 0 → 1 |
| `setCount(c => c + 1)` | c => c + 1 | 1 → 2 |
| `setCount(c => c + 1)` | c => c + 1 | 2 → 3 |

> **ポイント** 迷ったら「前の値に依存した更新は関数型」と覚えましょう。非同期処理の後（`await` の後や `setTimeout` の中）で state を更新するときも、クロージャの値は古くなっている可能性があるので、関数型アップデートが安全です。

### 更新関数は純粋に

`setCount(c => ...)` に渡す関数は、**引数から次の値を計算して返すだけ**にします。中で API を呼んだり、別の state を更新したり、props の関数を呼んだりしてはいけません。開発時の StrictMode では、純粋かどうかを確かめるために**更新関数が2回呼ばれる**ので、副作用があると2回実行されてしまいます。

## イベントハンドラに処理を書く

「値が変わったら親に通知したい」とき、2つの書き方が考えられます。

```tsx bad
// useEffect で監視する
useEffect(() => {
  onChange?.(count);
}, [count]); // 初回マウント時にも呼ばれてしまう／余計なレンダーが発生する
```

```tsx good
// イベントハンドラの中で、次の値を計算してから両方に使う
const increment = () => {
  const next = count + 1;
  setCount(next);
  onChange?.(next);
};
```

**「ユーザーの操作が原因で起きること」はイベントハンドラに書く**のが React 公式の推奨です（公式ドキュメント「You Might Not Need an Effect」）。`useEffect` は「画面に表示されたこと」が原因で起きる処理（データ取得、外部システムとの同期）のためのものです（R-05）。

## 派生する値は計算する

```tsx
const [count, setCount] = useState(0);
const isMax = count >= max; // state にしない。毎レンダー計算すれば常に正しい

<button disabled={isMax}>+</button>;
```

state から計算できる値を、別の state として持つ必要はありません（R-04 で詳しく）。

## 課題に入る前に

- props はデフォルト値付きの分割代入で受け取る（`min = -Infinity` など）
- 値を min〜max に収める処理（clamp）は小さな関数に切り出すとすっきりします: `Math.min(max, Math.max(min, n))`
- 「+3」は、まず**わざと** `setCount(count + step)` を3回呼んでテストが落ちるのを確認してから直してください
- `onChange` は「値が変わったとき1回」。初回表示時には呼ばない。上の「イベントハンドラに処理を書く」を参考に
- 現在値は `data-testid="count"` の要素に表示

## 面接で聞かれたら

<details>
<summary>Q. setCount(count + 1) を3回呼んでも +1 にしかならないのはなぜ？</summary>

state はレンダーごとのスナップショットで、イベントハンドラ内の count はそのレンダー時点の値に固定されているからです。3回とも同じ count を元に「count + 1 にする」という同じ値を指定しているので、結果は +1 になります。

</details>

<details>
<summary>Q. setCount(c => c + 1) はなぜ解決になるのですか？</summary>

関数を渡すと、React はそれをキューに積み、前の更新の結果を引数として渡しながら順番に実行するからです。1回目の結果が2回目の引数になるので、3回呼べば正しく +3 されます。前の state に依存して次の state を決めるときは、関数型アップデートを使うのが安全です。

</details>

<details>
<summary>Q. state を更新した直後の console.log(count) が古い値なのはなぜ？</summary>

setState は state をその場で書き換えるのではなく、次のレンダーのための更新を予約するだけだからです。今実行中のハンドラの count は、このレンダーで受け取った定数なので変わりません。新しい値は再レンダー時にコンポーネント関数が再実行されたときに得られます。更新後の値を使いたいなら、次の値を変数に計算しておいて、それを set と処理の両方に使います。

</details>

<details>
<summary>Q. 値の変化を親に伝えるのは、useEffect とイベントハンドラのどちらで行うべき？</summary>

イベントハンドラの中で行うべきです。useEffect で state を監視して呼ぶと、初回マウント時にも呼ばれてしまったり、余計なレンダーが走ったり、どの操作が原因で呼ばれたのか追いにくくなったりします。ユーザー操作が原因の処理はイベントハンドラに書き、useEffect は外部システムとの同期のために使う、というのが React 公式の推奨です。

</details>

## 理解度チェック

<details>
<summary>1. 次のコードで、ボタンを押して3秒以内にもう2回押すと、最終的に何になる？</summary>

```tsx
const handleClick = () => {
  setTimeout(() => setCount(count + 1), 3000);
};
```

1 になります。3回とも、クリックした時点のレンダー（count = 0）のクロージャで `setCount(0 + 1)` が予約されるからです。`setCount((c) => c + 1)` にすれば 3 になります。

</details>

<details>
<summary>2. <code>useState(heavyCompute())</code> の問題点と対策は？</summary>

初期値は最初のレンダーでしか使われないのに、`heavyCompute()` は毎レンダー実行されてしまいます。`useState(() => heavyCompute())` と関数を渡すと、最初の1回だけ実行されます（遅延初期化。R-06 で使います）。

</details>
