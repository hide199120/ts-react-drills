# 配列メソッド

## この章で学ぶこと

- `map` / `filter` / `find` / `some` / `every` / `reduce` の使い方
- メソッドチェーンでデータを加工する考え方
- `sort` の比較関数と「破壊的メソッド」の危険性
- `Set` / `Map` を使った重複除去と集計
- `Record` 型でオブジェクトを辞書として扱う

React では「配列 state を加工して表示する」場面が非常に多く、ここで学ぶメソッドを毎日使います。`for` 文でも書けますが、**「何をしたいか」がメソッド名で伝わる**ので、配列メソッドで書くのが現代的な書き方です。

## 基本の4つ

### map：全要素を変換する

```ts
const prices = [100, 200, 300];
const withTax = prices.map((p) => p * 1.1); // [110, 220, 330]

const users = [
  { id: 1, name: "Taro" },
  { id: 2, name: "Hanako" },
];
const names = users.map((u) => u.name); // ["Taro", "Hanako"]
```

- 戻り値は**同じ長さの新しい配列**。元の配列は変わらない
- コールバックの第2引数でインデックスも受け取れる: `map((item, index) => ...)`

### filter：条件に合うものだけ残す

```ts
const nums = [1, 2, 3, 4, 5];
const evens = nums.filter((n) => n % 2 === 0); // [2, 4]

const activeUsers = users.filter((u) => u.active);
```

- コールバックが `true` を返した要素だけの**新しい配列**を返す

### find / some / every：探す・判定する

```ts
users.find((u) => u.id === 2); // { id: 2, name: "Hanako" }（見つからなければ undefined）
users.findIndex((u) => u.id === 2); // 1（見つからなければ -1）
nums.some((n) => n > 4); // true（1つでも満たせば true）
nums.every((n) => n > 0); // true（全部満たせば true）
nums.includes(3); // true（値そのものが含まれるか）
```

`find` の戻り値は `T | undefined` 型です。見つからない可能性を型が教えてくれるので、使う前にチェックが必要です。

### reduce：配列を1つの値に畳み込む

`reduce` は最も強力で、最も読みにくいメソッドです。

```ts
const nums = [1, 2, 3, 4];
const sum = nums.reduce((acc, n) => acc + n, 0); // 10
```

動きを分解するとこうなります。

| 回 | acc（累積値） | n（今の要素） | 戻り値 = 次の acc |
|---|---|---|---|
| 1 | 0（初期値） | 1 | 1 |
| 2 | 1 | 2 | 3 |
| 3 | 3 | 3 | 6 |
| 4 | 6 | 4 | 10 |

`reduce((累積値, 要素) => 次の累積値, 初期値)` と覚えましょう。

**オブジェクトを作る**のにもよく使います。

```ts
const fruits = ["apple", "banana", "apple", "cherry", "apple"];

const counts = fruits.reduce<Record<string, number>>((acc, fruit) => {
  acc[fruit] = (acc[fruit] ?? 0) + 1;
  return acc; // ← 忘れがち。必ず return する
}, {});
// { apple: 3, banana: 1, cherry: 1 }
```

> **注意** `reduce` で初期値に `{}` を渡すと、TypeScript は累積値の型を `{}`（何もプロパティが無い型）と推論し、`acc[fruit] = ...` がエラーになります。`reduce<Record<string, number>>(...)` のように**型引数で累積値の型を指定する**か、`{} as Record<string, number>` と初期値に型を付けます。

> **注意** `reduce` の中で `return` を忘れると、次の回の `acc` が `undefined` になります。波括弧 `{}` を使ったアロー関数では `return` が必要、という基本を忘れずに。

## Record 型：辞書としてのオブジェクト

キーが動的に決まるオブジェクトには `Record<キーの型, 値の型>` を使います。

```ts
const scores: Record<string, number> = {};
scores["taro"] = 80;
scores.hanako = 95;

type Status = "todo" | "done";
const labels: Record<Status, string> = {
  todo: "未完了",
  done: "完了",
}; // Status の全キーが必須になる
```

このリポジトリでは `noUncheckedIndexedAccess` が有効なので、`scores["taro"]` の型は `number | undefined` になります。存在しないキーにアクセスすると `undefined` が返るという実態に合わせた、より安全な設定です。

```ts
const s = scores["jiro"]; // number | undefined
const safe = scores["jiro"] ?? 0; // number
```

### オブジェクトと配列の相互変換

```ts
const obj = { taro: 80, hanako: 95 };
Object.keys(obj); // ["taro", "hanako"]
Object.values(obj); // [80, 95]
Object.entries(obj); // [["taro", 80], ["hanako", 95]]

const back = Object.fromEntries([["a", 1], ["b", 2]]); // { a: 1, b: 2 }
```

`Object.entries` で `[キー, 値]` の配列にすれば、配列メソッドで並べ替えや絞り込みができます。

## メソッドチェーン

配列を返すメソッドはつなげて書けます。

```ts
const orders = [
  { customer: "Sato", amount: 3000, status: "paid" },
  { customer: "Suzuki", amount: 5000, status: "pending" },
  { customer: "Sato", amount: 2000, status: "paid" },
];

const paidTotal = orders
  .filter((o) => o.status === "paid") // 1. 支払い済みだけ
  .map((o) => o.amount) // 2. 金額だけ取り出し
  .reduce((sum, a) => sum + a, 0); // 3. 合計
// 5000
```

各行が1つの処理になっていて、「何をしているか」が上から順に読めます。`reduce` 1回にまとめることもできますが、**読みやすさを優先して段階を分ける**のが一般的です。数万件を超えるような大きな配列でない限り、性能差は気にしなくて大丈夫です。

## sort と破壊的メソッド

### 比較関数

`sort` には比較関数を渡します。**戻り値が負なら a が前、正なら b が前**です。

```ts
const nums = [10, 1, 5];
nums.sort((a, b) => a - b); // [1, 5, 10] 昇順
nums.sort((a, b) => b - a); // [10, 5, 1] 降順

const names = ["佐藤", "Ito", "suzuki"];
names.sort((a, b) => a.localeCompare(b)); // 文字列は localeCompare
```

> **注意** 比較関数を省略すると、**要素を文字列に変換して辞書順で並べます**。`[10, 1, 5].sort()` は `[1, 10, 5]` になります。数値の並べ替えでは必ず比較関数を渡しましょう。

### 複数条件で並べる

「金額の降順、同じなら名前の昇順」のような複数条件は `||` でつなげます。

```ts
items.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
```

1つ目の比較が `0`（同じ）のときだけ `||` の右側が評価される、という仕組みです。

### 破壊的メソッドに注意

`sort` は**元の配列そのものを並べ替えます**（破壊的メソッド）。

```ts bad
function sortedByPrice(products: Product[]) {
  return products.sort((a, b) => a.price - b.price); // 引数の配列が並び変わってしまう
}
```

これは呼び出し側の配列を勝手に変えてしまうバグの元で、React の state に対してやると画面が正しく更新されません。対策は2つです。

```ts good
// 1. コピーしてから並べる
return [...products].sort((a, b) => a.price - b.price);

// 2. 非破壊版の toSorted を使う（ES2023〜）
return products.toSorted((a, b) => a.price - b.price);
```

主な破壊的メソッドと、その非破壊版です。

| 破壊的（元を変える） | 非破壊（新しい配列を返す） |
|---|---|
| `sort` | `toSorted` |
| `reverse` | `toReversed` |
| `splice` | `toSpliced` / `filter` / `slice` |
| `push` / `unshift` | `[...arr, x]` / `[x, ...arr]` |
| `arr[i] = x` | `arr.with(i, x)` / `map` |

`map` / `filter` / `slice` / `concat` は最初から非破壊です。

## Set と Map

### Set：重複のない集合

```ts
const ids = [3, 1, 3, 2, 1];
const unique = [...new Set(ids)]; // [3, 1, 2]（最初に出た順を保つ）

const seen = new Set<number>();
seen.add(1);
seen.has(1); // true
seen.size; // 1
```

> **注意** `Set` は値を `===`（厳密には SameValueZero）で比較します。オブジェクトは**参照で比較される**ので、中身が同じでも別のオブジェクトなら重複とみなされません。「id が同じものを除く」なら、id を Set に入れて判定します。

```ts
const a = [{ id: 1 }, { id: 1 }];
new Set(a).size; // 2 ← 別のオブジェクトなので両方残る
```

### Map：何でもキーにできる辞書

```ts
const m = new Map<string, number>();
m.set("taro", 80);
m.get("taro"); // 80
m.get("jiro"); // undefined
m.has("taro"); // true
```

`Record`（普通のオブジェクト）との違いは、キーにオブジェクトなど何でも使えること、追加順が保証されること、`size` で件数が取れることです。

## 課題に入る前に

- **groupBy**: 上の「出現回数を数える」reduce とほぼ同じ形です。違いは値が「数」ではなく「配列」であること。キーがまだ無いときは空配列を用意してから push します（`??=` 演算子を使うと短く書けます: `obj[key] ??= []` は「undefined なら [] を代入」）
- **totalPaidByCustomer**: filter → reduce
- **topCustomers**: totalPaidByCustomer の結果を `Object.entries` で配列にして並べ替え。複数条件の sort を使います。`slice(0, n)` で先頭 n 件
- **uniqueBy**: 「見たことがあるキー」を Set に記録しながら filter
- ルールに注意: `for` 文禁止、元の配列を壊さないこと

## 面接で聞かれたら

<details>
<summary>Q. map と forEach の違いは？</summary>

`map` は各要素を変換した新しい配列を返します。`forEach` は戻り値が `undefined` で、各要素に対して処理を実行するだけです。値を変換して新しい配列が欲しいなら `map`、ログ出力など副作用だけが目的なら `forEach`（または `for...of`）を使います。`map` の結果を使わないのに `map` を使うのは意図が伝わりにくいので避けます。

</details>

<details>
<summary>Q. filter → map と reduce 1回、どちらを選びますか？</summary>

基本は filter → map のように段階を分けます。各ステップが何をしているかが名前で伝わり、読みやすく変更もしやすいからです。配列を2回走査することになりますが、通常のデータ量では性能差は無視できます。非常に大きな配列で計測して問題になった場合や、オブジェクトへの集計のように reduce のほうが自然な場合は reduce を使います。

</details>

<details>
<summary>Q. sort が破壊的なのはなぜ問題ですか？</summary>

元の配列を直接並べ替えるので、引数で受け取った配列や React の state に対して呼ぶと、呼び出し元のデータまで変わってしまいます。特に React では参照が同じままなので変更が検知されず、画面が更新されないバグになります。`[...arr].sort()` でコピーしてから並べるか、ES2023 の `toSorted` を使います。

</details>

<details>
<summary>Q. 配列の重複除去に Set を使うときの注意点は？</summary>

Set は値を厳密等価で比較するので、プリミティブ値の重複除去には便利ですが、オブジェクトは参照で比較されます。中身が同じでも別のオブジェクトは別物として残ります。オブジェクトの配列を id などで重複除去したい場合は、キーを Set に記録しながら filter するか、Map を使います。

</details>

## 理解度チェック

<details>
<summary>1. <code>["10", "9", "1"].map(parseInt)</code> の結果は？</summary>

`[10, NaN, 1]`。`map` はコールバックに `(要素, インデックス, 配列)` を渡すので、`parseInt("9", 1)`（基数1は不正）が呼ばれて NaN になります。`map((s) => parseInt(s, 10))` や `map(Number)` と書きます。

</details>

<details>
<summary>2. 空配列に対して <code>[].reduce((a, b) => a + b)</code>（初期値なし）を実行すると？</summary>

`TypeError` が投げられます。初期値を省略すると最初の要素が初期値になるため、空配列だと初期値が存在しないからです。**reduce には常に初期値を渡す**のが安全です。

</details>
