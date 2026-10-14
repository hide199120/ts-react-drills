# オブジェクト型とクロージャ

## この章で学ぶこと

- オブジェクトの型の書き方：`interface` と `type`
- オプショナルプロパティ `?` と `readonly`
- スプレッド構文によるコピーと「イミュータブルな更新」
- 参照とシャローコピー
- クロージャ：関数が変数を「閉じ込める」仕組み

この章の内容は、そのまま React の state 更新の考え方につながります。

## オブジェクトの型を書く

オブジェクトの形は `interface` か `type` で定義します。

```ts
interface User {
  id: number;
  name: string;
}

// type でもほぼ同じことができる
type Product = {
  id: string;
  price: number;
};

const user: User = { id: 1, name: "Taro" };
const bad: User = { id: 1 }; // エラー: name がない
```

### interface と type の違い

日常的な使い方ではどちらでも書けますが、違いはあります。

| | `interface` | `type` |
|---|---|---|
| オブジェクトの形 | ○ | ○ |
| ユニオン型 `A \| B` | ✕ | ○ |
| プリミティブの別名 `type ID = string` | ✕ | ○ |
| 継承 | `extends` | `&`（交差型） |
| 同名で宣言すると | **自動でマージされる** | エラー |

```ts
// interface の継承
interface Admin extends User {
  permissions: string[];
}

// type の交差型（同じ結果）
type Admin2 = User & { permissions: string[] };

// type でしかできないこと
type Status = "active" | "inactive";
type ID = string | number;
```

使い分けはチームの方針次第ですが、よくある方針は次の2つです。

- **オブジェクトの形は interface、それ以外は type**（TypeScript 公式ハンドブックの推奨に近い）
- **全部 type で統一**（ユニオンなどと書き方が揃う。React のコードベースで多い）

> **面接では** 「どちらでもいい」で終わらせず、「interface は宣言のマージができ、ライブラリの型拡張に使える。type はユニオンや条件型が書ける。チームではこう統一していた」まで言えると良い評価になります。

## オプショナルと readonly

### オプショナルプロパティ `?`

`?` を付けると「あってもなくてもいい」プロパティになります。

```ts
interface User {
  id: number;
  name: string;
  email?: string; // string | undefined として扱われる
}

const a: User = { id: 1, name: "Taro" }; // OK
const b: User = { id: 2, name: "Hanako", email: "h@example.com" }; // OK

function sendMail(user: User) {
  user.email.includes("@"); // エラー: undefined かもしれない
  if (user.email) {
    user.email.includes("@"); // OK: 絞り込まれた
  }
}
```

**「プロパティが存在しない」と「値が undefined」は、厳密には別物**です。

```ts
const x = { id: 1, name: "A" };
const y = { id: 1, name: "A", email: undefined };

"email" in x; // false
"email" in y; // true
Object.keys(y); // ["id", "name", "email"]
JSON.stringify(y); // '{"id":1,"name":"A"}'（undefined は出力されない）
```

テストの `toEqual` はこの2つを同一視しますが、`in` や `Object.keys` では違いが出ます。課題 TS-02 では「キー自体を持たない」ことを求めています。

### 条件付きでプロパティを含める

「値があるときだけプロパティを追加する」書き方はいくつかあります。

```ts
// 方法1: 後から代入する
const user: User = { id, name };
if (email !== undefined) user.email = email;

// 方法2: 条件付きスプレッド
const user2: User = {
  id,
  name,
  ...(email !== undefined && { email }),
};
```

方法2は、`false` をスプレッドすると何も展開されない、という性質を利用しています（`{ ...false }` は `{}`）。初見だと読みにくいので、方法1でも全く問題ありません。

### readonly

`readonly` を付けたプロパティは再代入できなくなります。

```ts
interface User {
  readonly id: number;
  name: string;
}

const u: User = { id: 1, name: "Taro" };
u.name = "Jiro"; // OK
u.id = 2; // エラー: 読み取り専用
```

> **注意** `readonly` は**コンパイル時だけ**のチェックです。JavaScript に変換されると消えるので、実行時には変更できてしまいます。実行時にも変更を禁止したいなら `Object.freeze()` を使いますが、こちらは**ネストしたオブジェクトまでは凍結しない**（浅い）点に注意。

## 参照とコピー

JavaScript のオブジェクトと配列は**参照**で扱われます。ここを理解していないと、React で「state を変えたのに画面が更新されない」というバグを生みます。

```ts
const a = { name: "Taro" };
const b = a; // コピーではなく、同じオブジェクトを指す
b.name = "Jiro";
console.log(a.name); // "Jiro" ← a も変わっている！
a === b; // true（同じ参照）
```

### スプレッド構文でコピーする

```ts
const a = { name: "Taro", age: 30 };
const b = { ...a }; // 新しいオブジェクトにプロパティをコピー
b.name = "Jiro";
console.log(a.name); // "Taro"（影響なし）
a === b; // false（別の参照）

// コピーしながら一部を上書き
const c = { ...a, age: 31 }; // { name: "Taro", age: 31 }

// 後に書いたものが勝つ
const d = { ...a, ...{ age: 99, city: "Tokyo" } }; // { name: "Taro", age: 99, city: "Tokyo" }
```

### シャローコピーの落とし穴

スプレッドは**1階層目だけ**をコピーします（シャローコピー）。ネストしたオブジェクトは参照が共有されたままです。

```ts bad
const user = { name: "Taro", address: { city: "Tokyo" } };
const copy = { ...user };
copy.address.city = "Osaka";
console.log(user.address.city); // "Osaka" ← 元も変わってしまう
```

ネストした部分も更新するなら、その階層もスプレッドします。

```ts good
const updated = {
  ...user,
  address: { ...user.address, city: "Osaka" },
};
```

完全に複製したい（ディープコピー）なら `structuredClone(obj)` が使えます。

### イミュータブル（不変）な更新

「元のオブジェクトを変更せず、変更を反映した新しいオブジェクトを作る」ことを**イミュータブルな更新**と呼びます。

```ts bad
function rename(user: User, name: string): User {
  user.name = name; // 引数を直接書き換えている（破壊的）
  return user;
}
```

```ts good
function rename(user: User, name: string): User {
  return { ...user, name }; // 新しいオブジェクトを返す
}
```

なぜイミュータブルにするのか。

1. **予測しやすい**: 関数を呼んでも、渡した値が勝手に変わらない
2. **変更を検出しやすい**: 参照が変わったかどうか（`prev !== next`）だけで「変わった」とわかる。**React はまさにこの方法で再レンダーの要否を判断します**
3. **履歴を残せる**: 前の状態がそのまま残るので、元に戻す（undo）機能などが作りやすい

## クロージャ

**クロージャ**とは、「関数が、自分が作られた場所の変数を覚えていて、後から使える」仕組みです。

```ts
function createCounter() {
  let count = 0; // この変数は外から直接触れない

  return () => {
    count++; // 外側の count を参照し続ける
    return count;
  };
}

const counterA = createCounter();
counterA(); // 1
counterA(); // 2

const counterB = createCounter();
counterB(); // 1 ← counterA とは別の count
```

ポイントは2つです。

- `createCounter()` を**呼ぶたびに新しい `count` 変数が作られる**。返された関数は、自分が作られたときの `count` を覚えている
- `count` は返された関数経由でしか触れない。**外から勝手に書き換えられない**（カプセル化）

### 関数を返す関数の型

関数の型は `(引数: 型) => 戻り値の型` と書きます。

```ts
function createGreeter(prefix: string): (name: string) => string {
  return (name) => `${prefix}、${name}さん`;
}

const hello = createGreeter("こんにちは");
hello("Taro"); // "こんにちは、Taroさん"
```

戻り値に関数の型を書いておくと、`return` するアロー関数の引数 `name` は型を書かなくても `string` と推論されます。

> **ポイント** React のフックはクロージャだらけです。`useState` の値をイベントハンドラ内で参照するとき、ハンドラは「そのレンダー時点の値」を閉じ込めています。R-02 で出てくる「古い値を参照してしまう問題（stale closure）」はこの仕組みが原因です。

## 課題に入る前に

- **UserPatch**: 「User から id を除いて、残りを全部任意に」。この章では手で書いても動きますが、課題のルールは `Partial` と `Omit` で導出すること。使い方は次の通りで、組み合わせ方は自分で考えてください（詳しくは TS-06 で学びます）
  - `Omit<T, "key">`: T から key を除いた型
  - `Partial<T>`: T の全プロパティを任意にした型
- **createUserFactory**: 上の `createCounter` とほぼ同じ構造です。採番用の変数をどこに置くかがポイント
- **updateUser**: 元の user を変更しないこと。スプレッド2つで書けます

## 面接で聞かれたら

<details>
<summary>Q. interface と type の違いは？ どう使い分けますか？</summary>

どちらもオブジェクトの形を定義できますが、`type` はユニオン型やプリミティブの別名、条件型なども書けます。`interface` は同名で宣言すると自動でマージされるので、ライブラリの型を拡張するときに使われます。使い分けはチームの方針次第で、私は「オブジェクトの形は interface、ユニオンなどは type」（または「type に統一」）という方針で書いていました。大事なのはプロジェクト内で統一することだと思います。

</details>

<details>
<summary>Q. readonly は実行時にも効きますか？</summary>

効きません。TypeScript の型情報はコンパイル時に消えるので、`readonly` はコンパイル時のチェックだけです。実行時にも変更を防ぎたいなら `Object.freeze` を使いますが、これもネストしたオブジェクトまでは凍結しない浅いものです。

</details>

<details>
<summary>Q. スプレッド構文でコピーしたとき、ネストしたオブジェクトはどうなりますか？</summary>

スプレッドはシャローコピーなので、ネストしたオブジェクトは参照が共有されたままです。コピー側でネスト部分を書き換えると、元のオブジェクトも変わってしまいます。ネストした部分を更新するときはその階層もスプレッドしてコピーするか、完全な複製が必要なら `structuredClone` を使います。

</details>

<details>
<summary>Q. クロージャとは何ですか？</summary>

関数が、定義された場所のスコープの変数を覚えていて、関数の外に持ち出された後もその変数にアクセスできる仕組みです。例えばカウンターを作る関数の中で変数を宣言し、それを増やす関数を返すと、返された関数経由でしかその変数を操作できなくなります。呼び出すたびに新しい変数が作られるので、作ったカウンター同士は独立します。React のフックやイベントハンドラも、レンダー時の値をクロージャで閉じ込めて使っています。

</details>

## 理解度チェック

<details>
<summary>1. 次のコードの最後の console.log は何を出力する？</summary>

```ts
const list = [{ done: false }];
const copy = [...list];
copy[0].done = true;
console.log(list[0].done);
```

`true`。配列のスプレッドもシャローコピーなので、要素のオブジェクトは同じ参照です。要素を変更するなら `list.map((t, i) => i === 0 ? { ...t, done: true } : t)` のように要素ごと新しく作ります。

</details>

<details>
<summary>2. <code>{ ...a, ...b }</code> と <code>{ ...b, ...a }</code> の違いは？</summary>

同じキーがあった場合、**後に書いたほうの値が勝ちます**。設定のデフォルト値と上書き値を合成するときは `{ ...defaults, ...overrides }` の順にします。

</details>
