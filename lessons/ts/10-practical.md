# 実践: よく出る実装問題

## この章で学ぶこと

- debounce と throttle：仕組み・違い・使いどころ
- タイマー ID の型 `ReturnType<typeof setTimeout>`
- 可変長引数と `Parameters`：元の関数の型を保つラッパー関数
- メモ化と `Map` によるキャッシュ
- 型安全なイベントエミッター（Pub/Sub）

いずれも面接のコーディング課題で定番の題材で、ライブラリ（lodash, mitt など）の中身でもあります。これまでの章で学んだ**クロージャ・ジェネリクス・keyof** の総復習です。

## debounce と throttle

どちらも「**関数が呼ばれる頻度を減らす**」テクニックです。

### debounce：落ち着いてから1回

**最後に呼ばれてから一定時間、次の呼び出しが無かったら**実行します。呼ばれ続けている間は実行されません。

```text
呼び出し:  ● ● ●     ●         （● = 呼ばれた）
実行:              ○          ○  （最後の呼び出しから 300ms 後）
```

用途: 検索ボックスの入力（打ち終わってから検索）、ウィンドウのリサイズ完了時の再計算、フォームの自動保存。

仕組みは「呼ばれるたびに、前のタイマーをキャンセルしてタイマーを張り直す」だけです。

```ts
function debounce(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer); // 前の予約を取り消す
    timer = setTimeout(fn, ms); // 新しく予約し直す
  };
}
```

`timer` はクロージャ（TS-02）で、返された関数ごとに1つずつ持っています。

### throttle：一定間隔で最大1回

**一度実行したら、一定時間は次の実行を受け付けません**。呼ばれ続けても、一定間隔で実行されます。

```text
呼び出し:  ●●●●●●●●●●●●●●●●●
実行:      ○     ○     ○        （100ms ごとに最大1回）
```

用途: スクロールイベント（無限スクロールの位置判定）、マウス移動への追従、連打防止。

```ts
function throttle(fn: () => void, ms: number) {
  let waiting = false;
  return () => {
    if (waiting) return; // 待機中は無視
    fn();
    waiting = true;
    setTimeout(() => {
      waiting = false;
    }, ms);
  };
}
```

> **ポイント** 違いを一言で言うと、debounce は「**最後**の1回」、throttle は「**定期的**に1回」。検索入力に throttle を使うと入力途中の文字列で何度も検索が走り、スクロールに debounce を使うとスクロールが止まるまで何も起きない、という違いになります。

### タイマー ID の型

`setTimeout` の戻り値は、ブラウザでは `number`、Node.js では `Timeout` オブジェクトです。環境に依存しない書き方が `ReturnType<typeof setTimeout>` です（TS-06 の復習）。

```ts
let timer: ReturnType<typeof setTimeout> | undefined;
clearTimeout(undefined); // undefined を渡しても安全（何もしない）
```

## 元の関数の型を保つラッパー

上の debounce は引数なしの関数にしか使えません。**どんな引数の関数でも包めて、しかも型を保つ**ようにするには、可変長引数とジェネリクスを組み合わせます。

### 可変長引数（rest parameters）

```ts
function log(...args: unknown[]) {
  console.log(...args); // スプレッドで展開して渡す
}
log(1, "a", true); // args = [1, "a", true]
```

### 引数の型をジェネリクスで受け取る

```ts
function logged<A extends unknown[], R>(fn: (...args: A) => R) {
  return (...args: A): R => {
    console.log("呼び出し:", args);
    return fn(...args);
  };
}

const add = (a: number, b: number) => a + b;
const loggedAdd = logged(add); // (a: number, b: number) => number
loggedAdd(1, 2); // OK
loggedAdd("1", 2); // エラー: 元の関数と同じ型チェックが効く
```

`A extends unknown[]` で「引数のタプル型」を受け取り、返す関数でもそのまま `...args: A` として使っています。`add` を渡すと A は `[a: number, b: number]` と推論されます。

`Parameters<F>` を使って書くこともできます。

```ts
function logged<F extends (...args: never[]) => unknown>(fn: F) {
  return (...args: Parameters<F>) => fn(...args);
}
```

### 関数にプロパティを足す

debounce の `cancel()` のように、**関数にメソッドを持たせる**には、関数型とオブジェクト型の交差型を使います。

```ts
type Cancelable<A extends unknown[]> = ((...args: A) => void) & { cancel: () => void };
// 「呼び出せる」かつ「cancel プロパティを持つ」値の型
```

JavaScript では関数もオブジェクトなので、プロパティを後から代入できます。

```ts
function withCancel(fn: () => void) {
  const wrapped = () => fn();
  wrapped.cancel = () => {
    /* ... */
  };
  return wrapped; // 型は (() => void) & { cancel: () => void } と推論される
}
```

TypeScript は、`const` で宣言した関数にプロパティを代入すると、それを型に含めてくれます（expando property）。

## メモ化（memoize）

**同じ引数で呼ばれたら、前回の結果を返して計算を省略する**テクニックです。

```ts
const cache = new Map<number, number>();

function slowSquare(n: number): number {
  if (cache.has(n)) return cache.get(n)!;
  const result = n * n; // 本当は重い計算
  cache.set(n, result);
  return result;
}
```

### `has` でチェックする理由

```ts bad
const cached = cache.get(key);
if (cached !== undefined) return cached; // 結果が undefined の関数だと、毎回再計算される
```

`get` は「キーが無い」ときも「値が undefined」のときも `undefined` を返すので区別できません。`has` で**キーの存在**を確かめます。`cache.get(key)!` の `!`（非 null アサーション）は、`has` で確かめた直後なので安全、という意味で使っています。

### メモ化の注意点

- **キャッシュが増え続ける**: 引数のバリエーションが多いとメモリを圧迫する。上限を設ける（LRU キャッシュ）などの対策が必要
- **オブジェクトの引数**: `Map` は参照で比較するので、中身が同じでも別オブジェクトならキャッシュに当たらない
- **純粋関数にだけ使う**: 同じ引数でも結果が変わる関数（現在時刻、乱数、API 呼び出し）をメモ化すると古い結果を返してしまう

React の `useMemo` / `React.memo`（R-09）も同じ考え方です。

## 型安全なイベントエミッター

**Pub/Sub（発行/購読）パターン**は、「何かが起きたら、登録しておいた関数を呼ぶ」仕組みです。DOM の `addEventListener` や Node.js の `EventEmitter` がこれです。

### 素朴な実装

```ts
const handlers = new Map<string, Set<(payload: unknown) => void>>();

function on(event: string, handler: (payload: unknown) => void) {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler);
  return () => handlers.get(event)?.delete(handler); // 登録解除関数を返す
}

function emit(event: string, payload: unknown) {
  handlers.get(event)?.forEach((h) => h(payload));
}
```

これだと、イベント名のタイプミス（`"logni"`）も、payload の型の間違いも検出できません。

### イベントの「型の地図」を渡す

イベント名と payload の型の対応を1つの型にまとめ、ジェネリクスで受け取ります。

```ts
type AppEvents = {
  login: { userId: number };
  logout: undefined;
  message: { text: string; from: string };
};
```

そして、`on` と `emit` のイベント名を `K extends keyof Events`、payload を `Events[K]` にします（TS-04 の `getProp` と同じ形です）。

```ts
function on<K extends keyof AppEvents>(event: K, handler: (payload: AppEvents[K]) => void) {
  // ...
}

on("login", (p) => p.userId); // p: { userId: number }
on("logni", () => {}); // エラー: タイプミスを検出
```

これを「AppEvents を型引数で受け取るファクトリ関数」にすれば、どんなイベント定義にも使える汎用のエミッターになります。

### Set を使う理由

ハンドラの保存に配列ではなく `Set` を使うと、

- 同じ関数を2回登録しても1つになる
- 削除が `delete(handler)` で簡単（配列だと `indexOf` + `splice` や `filter` が必要）

という利点があります。

### 登録解除関数を返す設計

`on` が「登録を解除する関数」を返す設計は、React の `useEffect` のクリーンアップと相性が良いです。

```ts
useEffect(() => {
  const off = emitter.on("login", handleLogin);
  return off; // アンマウント時に自動で解除
}, []);
```

登録解除を忘れると、コンポーネントが消えた後もハンドラが呼ばれ続ける（メモリリーク）ので、とても大事な設計です。

## 課題に入る前に

- **debounce**: 「引数を保つ」「cancel を持つ」の2点を、この章の可変長引数と expando property で
- **throttle**: 待機中フラグ。最初の呼び出しは即実行
- **memoize**: `Map` + `has`。型は `<Arg, R>(fn: (arg: Arg) => R) => (arg: Arg) => R`
- **createEmitter**: `<Events extends Record<string, unknown>>()` を型引数で受け取り、`on` / `emit` をジェネリックメソッドにする。内部の Map の値の型は少し工夫が必要（ハンドラの型がイベントごとに違うため）。どうしても型が合わない場合、内部実装に限って最小限の `as` を使うのは許容します
- テストはフェイクタイマー（`vi.useFakeTimers`）で時間を進めて検証しています

## 面接で聞かれたら

<details>
<summary>Q. debounce と throttle の違いと、それぞれのユースケースは？</summary>

debounce は、最後に呼ばれてから一定時間呼び出しが無かったときに1回だけ実行します。入力が止まってから検索する検索ボックスや、リサイズ完了後の再計算に使います。throttle は、一度実行したら一定時間は次の実行を無視するので、呼ばれ続けても一定間隔で実行されます。スクロール位置の監視やマウス追従など、連続イベント中も定期的に処理したい場合に使います。

</details>

<details>
<summary>Q. メモ化の注意点は？</summary>

キャッシュが増え続けてメモリを圧迫する可能性があるので、上限や破棄のルールが必要です。また Map などで参照比較する場合、オブジェクトの引数は中身が同じでも別物として扱われキャッシュに当たりません。さらに、同じ引数で常に同じ結果を返す純粋関数にしか使えません。比較やキャッシュ管理のコストもあるので、計算が十分に重い場合に使うべきです。

</details>

<details>
<summary>Q. Parameters&lt;F&gt; を使うと何が嬉しいですか？</summary>

関数の引数の型をタプルとして取り出せるので、元の関数をラップする関数（debounce やロガーなど）で、元の関数と全く同じ引数の型を保てます。引数の型を手で書き直す必要がなく、元の関数の型が変わっても自動で追従します。

</details>

## 理解度チェック

<details>
<summary>1. debounce した関数を React コンポーネントの本体で毎回作るとどうなる？</summary>

```tsx
function Search() {
  const search = debounce(doSearch, 300); // レンダーのたびに新しく作られる
}
```

再レンダーのたびに新しい debounce 関数（新しいタイマー変数）が作られるので、前のタイマーをキャンセルできず、debounce が効きません。`useMemo` や `useRef` で同じ関数を保持するか、R-06 のように「値を debounce するフック」を使います。

</details>

<details>
<summary>2. emitter のハンドラの中で、自分自身を off するとどうなる？</summary>

`Set` の `forEach` 中に要素を削除しても、未訪問の要素は正しく処理され、削除した要素はスキップされます（仕様で定義されている）。配列を `forEach` しながら `splice` すると要素が飛ばされるバグになりやすいので、その点でも Set が扱いやすいです。

</details>
