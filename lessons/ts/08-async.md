# 非同期処理

## この章で学ぶこと

- Promise とは何か、`new Promise` の書き方
- `async` / `await` と、エラーが伝わる仕組み
- 並列（`Promise.all` など）と直列（`for...of` + `await`）
- `Promise.all` / `allSettled` / `race` / `any` の違い
- タイムアウトとリトライの実装
- イベントループ：マイクロタスクとマクロタスク

## Promise とは

Promise は「**いつか結果が出る処理**」を表すオブジェクトです。状態は3つあります。

| 状態 | 意味 |
|---|---|
| pending（待機中） | まだ結果が出ていない |
| fulfilled（成功） | 値が得られた（resolve された） |
| rejected（失敗） | エラーになった（reject された） |

一度 fulfilled か rejected になると、それ以降状態は変わりません。

### new Promise で作る

コールバック形式の API（`setTimeout` など）を Promise にするときは `new Promise` を使います。

```ts
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms); // ms 後に成功させる
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img); // 成功時に値を渡す
    img.onerror = () => reject(new Error(`読み込み失敗: ${src}`)); // 失敗時
    img.src = src;
  });
}
```

`new Promise` に渡す関数は**すぐに（同期的に）実行され**、`resolve` か `reject` を呼んだ時点で状態が決まります。2回目以降の呼び出しは無視されます。

### then / catch / finally

```ts
loadImage("/a.png")
  .then((img) => console.log(img.width)) // 成功時
  .catch((e) => console.error(e)) // 失敗時（途中のどこで失敗しても来る）
  .finally(() => console.log("完了")); // 成否に関わらず最後に
```

## async / await

`async` 関数の中では `await` で Promise の結果を待てます。then の連鎖より、同期処理のように上から読めるのが利点です。

```ts
async function showUser(id: number): Promise<string> {
  const res = await fetch(`/api/users/${id}`); // 完了まで待つ
  const user = await res.json();
  return user.name; // async 関数の return は Promise<string> になる
}
```

ポイントは次の3つです。

1. **`async` 関数は必ず Promise を返す**。`return "a"` と書いても戻り値は `Promise<string>`
2. **`async` 関数の中で `throw` すると、返す Promise が reject される**
3. **`await` した Promise が reject されると、その行で例外が投げられる**ので、`try / catch` で捕まえられる

```ts
async function safeShowUser(id: number) {
  try {
    return await showUser(id);
  } catch (e) {
    console.error("取得失敗", e);
    return "不明";
  }
}
```

> **注意** `try` の中で `return showUser(id)` と **`await` を付けずに返す**と、reject が `try / catch` を素通りして呼び出し元に伝わってしまいます。`try` の中で Promise を返すときは `return await` と書きます。

## 並列と直列

### 直列：前の結果を待ってから次へ

```ts
// 1件ずつ順番に取得（合計時間 = 各処理の合計）
const users = [];
for (const id of [1, 2, 3]) {
  users.push(await fetchUser(id));
}
```

### 並列：まとめて開始して、全部を待つ

```ts
// 3件同時に開始（合計時間 = 一番遅い処理の時間）
const users = await Promise.all([1, 2, 3].map((id) => fetchUser(id)));
```

`map` で Promise の配列を作った時点で、3つのリクエストはすべて**開始済み**です。`Promise.all` はそれらが全部終わるのを待ち、**元の配列と同じ順番で**結果を返します（終わった順ではありません）。

### どちらを使うか

| 直列を使う | 並列を使う |
|---|---|
| 前の結果が次の処理に必要（依存関係がある） | それぞれが独立している |
| 相手のサーバーに負荷をかけたくない、レート制限がある | とにかく速くしたい |
| 順番に実行されること自体が重要（DB の更新順など） | |

### forEach + await の罠

```ts bad
// 待ってくれない！
[1, 2, 3].forEach(async (id) => {
  await save(id);
});
console.log("完了"); // save が終わる前に表示される
```

`forEach` はコールバックの戻り値（Promise）を無視するので、`await` していても誰も待っていません。しかも全部が同時に開始されます（並列になる）。

```ts good
// 直列にしたいなら for...of
for (const id of [1, 2, 3]) {
  await save(id);
}
// 並列にしたいなら Promise.all
await Promise.all([1, 2, 3].map((id) => save(id)));
```

## Promise の組み合わせ関数

| 関数 | 結果 | 1つ失敗したら |
|---|---|---|
| `Promise.all(ps)` | 全部成功したら、値の配列 | **即座に**その失敗で reject |
| `Promise.allSettled(ps)` | 全部終わったら、各結果（成功/失敗）の配列 | reject しない |
| `Promise.race(ps)` | **一番早く終わったもの**の結果（成功でも失敗でも） | それが最初なら reject |
| `Promise.any(ps)` | **一番早く成功したもの**の値 | 全部失敗したときだけ reject |

### allSettled の結果

```ts
const results = await Promise.allSettled([fetchUser(1), fetchUser(2)]);
for (const r of results) {
  if (r.status === "fulfilled") {
    console.log(r.value); // 成功の値
  } else {
    console.log(r.reason); // 失敗の理由
  }
}
```

結果は TS-05 で学んだ判別可能なユニオン（`status` が判別子）になっています。「一部失敗しても、成功した分は使いたい」ときに使います。

### race でタイムアウトを作る

`race` は「どちらか早いほう」なので、**一定時間後に reject する Promise と競争させる**とタイムアウトになります。

```ts
const timeout = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error("timeout")), 3000),
);
const user = await Promise.race([fetchUser(1), timeout]);
```

> **ポイント** 本物のコードでは、勝負がついた後もタイマーが残り続けるので、`clearTimeout` で片付けるとより丁寧です（`finally` を使うと成否どちらでも片付けられます）。なお、`race` で負けた fetch 自体は止まりません。通信を本当に止めるには `AbortController` を使います（R-05 で学びます）。

## リトライ

失敗したら数回やり直す処理は、`for` ループと `try / catch` で素直に書けます。

```ts
async function fetchWithRetry(url: string, maxAttempts: number) {
  let lastError: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fetch(url); // 成功したら即 return でループを抜ける
    } catch (e) {
      lastError = e; // 失敗したら記録して次の回へ
    }
  }
  throw lastError; // 全部失敗したら最後のエラーを投げる
}
```

実務では、リトライの間隔を少しずつ空ける（指数バックオフ: 1秒, 2秒, 4秒…）のが一般的です。

## イベントループ

JavaScript は**シングルスレッド**で、一度に1つの処理しか実行できません。それでも非同期処理ができるのは、**イベントループ**という仕組みで「後で実行する処理」を順番待ちさせているからです。

```ts
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// 出力: 1 → 4 → 3 → 2
```

なぜこの順番になるのか。

1. まず同期処理がすべて実行される（`1`, `4`）
2. 次に**マイクロタスク**のキューが空になるまで実行される（Promise の then / await の続き → `3`）
3. その後、**マクロタスク**（タスク）のキューから1つ実行される（setTimeout → `2`）
4. 2 と 3 を繰り返す

| 種類 | 例 |
|---|---|
| マイクロタスク | `Promise.then` / `await` の続き / `queueMicrotask` |
| マクロタスク | `setTimeout` / `setInterval` / I/O / UI イベント |

**Promise のコールバックは setTimeout(0) より先に実行される**、と覚えておけば十分です。

> **注意** 重い同期処理（巨大なループなど）を書くと、その間はイベントループが止まり、画面のクリックやアニメーションもすべて固まります。`async` を付けても同期処理は速くなりません。重い計算は Web Worker に逃がすなどの対策が必要です。

## 課題に入る前に

- **sleep**: この章の `wait` と同じ
- **withTimeout**: `Promise.race` + reject するタイマー。元の Promise の reject はそのまま伝わる（race の性質）
- **retry**: 「最大 retries 回再実行」なので、実行回数は最大 retries + 1 回。`return await` を忘れずに
- **fetchAllInParallel**: `Promise.all` + `map`
- **fetchAllSettled**: `Promise.allSettled` の結果を status で振り分ける。失敗した id はインデックスで ids から引く
- **runSequentially**: `for...of` + `await`

## 面接で聞かれたら

<details>
<summary>Q. Promise.all / allSettled / race / any の違いは？</summary>

all はすべて成功したら値の配列を返し、1つでも失敗するとその時点で reject します。allSettled はすべてが完了するまで待ち、成功・失敗それぞれの結果を配列で返すので、一部失敗しても成功分を使えます。race は一番早く完了したものの結果を、成功でも失敗でもそのまま返すので、タイムアウトの実装に使えます。any は一番早く成功したものの値を返し、全部失敗したときだけ reject します。

</details>

<details>
<summary>Q. forEach の中で await しても待ってくれないのはなぜですか？</summary>

forEach はコールバックの戻り値を使わないので、async コールバックが返す Promise を誰も待っていないからです。結果として全部の処理が同時に開始され、forEach 自体はすぐに終わります。順番に待ちたいなら for...of の中で await、並列で全部待ちたいなら map で Promise の配列を作って Promise.all を使います。

</details>

<details>
<summary>Q. async 関数の中で throw すると、呼び出し側にはどう伝わりますか？</summary>

async 関数が返す Promise が、その例外で reject されます。呼び出し側では await していれば try/catch で捕まえられ、then を使っているなら catch で受け取れます。どちらでも受け取らないと unhandled rejection になります。

</details>

<details>
<summary>Q. 直列と並列、それぞれどんなときに使いますか？</summary>

前の処理の結果が次に必要な場合や、サーバーへの負荷・レート制限を考慮する必要がある場合は直列にします。各処理が独立していて速度を優先したいなら並列にします。大量のリクエストを並列にするとサーバーに負荷をかけるので、実務では同時実行数を制限する（例えば5件ずつ）方法もよく使います。

</details>

<details>
<summary>Q. マイクロタスクとマクロタスクの違いは？</summary>

どちらもイベントループで後から実行される処理ですが、優先度が違います。同期処理が終わると、まずマイクロタスク（Promise の then や await の続き）がキューが空になるまで全部実行され、その後マクロタスク（setTimeout や I/O、UI イベント）が1つ実行されます。なので Promise のコールバックは setTimeout(0) より先に実行されます。

</details>

## 理解度チェック

<details>
<summary>1. 次のコードの実行時間は約何秒？</summary>

```ts
const a = sleep(1000);
const b = sleep(1000);
await a;
await b;
```

約1秒。`sleep()` を呼んだ時点でタイマーは開始されているので、2つは並行して進みます。`await sleep(1000); await sleep(1000);` と書けば約2秒になります。**Promise は作った時点で処理が始まる**のがポイントです。

</details>

<details>
<summary>2. <code>Promise.all</code> で1つが失敗したとき、残りの処理は止まる？</summary>

止まりません。`Promise.all` は即座に reject しますが、他の Promise はそのまま実行され続けます（結果が捨てられるだけ）。通信を止めたいなら AbortController を使う必要があります。

</details>
