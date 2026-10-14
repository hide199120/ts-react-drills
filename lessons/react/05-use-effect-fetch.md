# useEffect とデータ取得

## この章で学ぶこと

- `useEffect` は何のためにあるか（外部システムとの同期）
- 依存配列：省略 / `[]` / `[a, b]` の違い
- クリーンアップ関数と、それが実行されるタイミング
- StrictMode で effect が2回実行される理由
- データ取得の状態管理と**競合状態（race condition）**
- `AbortController` によるリクエストのキャンセル
- 「その effect、本当に必要？」

## useEffect は「同期」のための仕組み

コンポーネント関数は「state から UI を計算する」純粋な処理であるべきです（R-02）。しかし、アプリには**React の外の世界**とやり取りする処理もあります。

- サーバーからデータを取得する
- タイマーを動かす（`setInterval`）
- `window` のイベントを購読する（resize, scroll）
- ブラウザ API やサードパーティのライブラリを操作する

これらを**レンダー中に直接書いてはいけません**（再レンダーのたびに何度も実行されてしまう）。`useEffect` は「**画面が表示された後に、外部システムを今の state / props と同期させる**」ための場所です。

```tsx
useEffect(() => {
  // 同期させる処理（セットアップ）
  const id = setInterval(() => console.log("tick"), 1000);

  return () => {
    // 同期をやめる処理（クリーンアップ）
    clearInterval(id);
  };
}, []); // 依存配列
```

## 依存配列

第2引数の配列で、**effect をいつ再実行するか**が決まります。

| 書き方 | 実行タイミング |
|---|---|
| `useEffect(fn)`（省略） | **毎回のレンダー後** |
| `useEffect(fn, [])` | **マウント時（最初の表示）に1回だけ** |
| `useEffect(fn, [a, b])` | マウント時と、**a か b が前回から変わったとき** |

```tsx
useEffect(() => {
  document.title = `${count}件の通知`;
}, [count]); // count が変わったら title を更新
```

### 依存配列には「effect の中で使っている、変化しうる値」を全部入れる

```tsx bad
useEffect(() => {
  fetchUser(userId).then(setUser);
}, []); // userId を使っているのに入れていない → userId が変わっても再取得されない
```

依存配列は「いつ実行したいか」を指定するものではなく、**「この effect が何に依存しているか」を正直に申告するもの**です。eslint-plugin-react-hooks の `exhaustive-deps` ルールを有効にすると、書き漏れを警告してくれます。

依存配列の値は前回と `Object.is` で比較されます。**レンダーのたびに新しく作られるオブジェクトや関数**を入れると、毎回「変わった」と判定されて effect が毎回実行されます（R-09 の useCallback / useMemo がその対策になります）。

## クリーンアップ

effect が関数を return すると、それが**クリーンアップ関数**になります。実行されるタイミングは2つです。

1. **依存配列の値が変わって、effect が再実行される直前**（前回の effect の後片付け）
2. **コンポーネントがアンマウント（画面から消える）されるとき**

```tsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize); // 登録解除
}, []);
```

クリーンアップを忘れると、コンポーネントが消えた後もイベントリスナーやタイマーが動き続けます（メモリリーク、存在しないコンポーネントの state 更新）。

`userId` が 1 → 2 → 3 と変わったときの実行順はこうなります。

```text
マウント      → effect(userId=1)
userId=2 に   → cleanup(userId=1) → effect(userId=2)
userId=3 に   → cleanup(userId=2) → effect(userId=3)
アンマウント  → cleanup(userId=3)
```

**前の effect の後片付けが、必ず次の effect の前に行われる**。この性質が、後で出てくる競合状態の対策の鍵になります。

## StrictMode で effect が2回実行される

開発環境で `<StrictMode>` を使っていると、マウント時に **effect → クリーンアップ → effect** と、わざと2回実行されます（本番ビルドでは1回）。

これは**クリーンアップが正しく書けているかを検査するため**です。正しくクリーンアップできていれば、1回目は綺麗に片付けられて、2回目だけが残るので問題は起きません。2回実行されて困る（例えばイベントリスナーが2重に登録される）なら、それはクリーンアップが漏れているというバグのサインです。

> **注意** 「2回実行されるのが嫌だから StrictMode を外す」「useRef のフラグで1回しか実行しないようにする」のは、症状を隠しているだけでバグは残っています。クリーンアップを正しく書くのが正解です。

## データ取得の基本形

```tsx
function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, [userId]);

  if (!user) return <p>読み込み中...</p>;
  return <h2>{user.name}</h2>;
}
```

effect に渡す関数自体を `async` にはできません（effect は「クリーンアップ関数」か「何も返さない」必要があるが、async 関数は Promise を返すため）。async/await を使いたいときは、中で関数を定義して呼びます。

```tsx
useEffect(() => {
  const load = async () => {
    const res = await fetch(`/api/users/${userId}`);
    setUser(await res.json());
  };
  void load();
}, [userId]);
```

### 状態を判別可能なユニオンで持つ

読み込み中・成功・失敗の状態は、TS-05 で学んだ判別可能なユニオンで持つと矛盾が起きません。

```tsx
type State = { status: "loading" } | { status: "success"; user: User } | { status: "error"; message: string };

const [state, setState] = useState<State>({ status: "loading" });
```

表示側は `switch (state.status)` で場合分けします。

## 競合状態（race condition）

上の基本形には、**見落とされがちな重大なバグ**があります。

ユーザーが「ユーザー1」を開いてすぐ「ユーザー2」に切り替えた場合を考えます。

```text
時刻 →
userId=1 のリクエスト開始 ──────────────────────(遅い)──── 完了 → setUser(ユーザー1) ✕
userId=2 のリクエスト開始 ──(速い)── 完了 → setUser(ユーザー2)
```

ネットワークの速度は一定ではないので、**後から出したリクエストが先に返ってくる**ことがあります。すると、最後に `setUser(ユーザー1)` が実行され、**userId=2 を表示しているのにユーザー1のデータが表示される**というバグになります。

これが**競合状態（race condition）**です。検索のインクリメンタルサーチ（R-10）では特に頻繁に起きます。

### 対策1：ignore フラグ

クリーンアップで「この effect の結果はもう不要」という印を付けます。

```tsx
useEffect(() => {
  let ignore = false;

  fetchUser(userId).then((user) => {
    if (!ignore) setUser(user); // 古い effect の結果なら無視
  });

  return () => {
    ignore = true; // userId が変わったら（次の effect の前に）立つ
  };
}, [userId]);
```

`ignore` は effect の実行ごとに作られるローカル変数（クロージャ）です。userId が変わると、前の effect のクリーンアップで**前の effect の** `ignore` が true になるので、遅れて届いた古い結果は捨てられます。

### 対策2：AbortController

ignore フラグは結果を無視するだけで、**通信自体は続いています**。`AbortController` を使うと、通信そのものを中止できます。

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then((res) => res.json())
    .then((user) => setUser(user))
    .catch((e) => {
      if (controller.signal.aborted) return; // 中止によるエラーは無視
      setError(e.message);
    });

  return () => controller.abort(); // 前のリクエストを中止
}, [userId]);
```

AbortController の仕組みはこうです。

- `new AbortController()` で中止ボタンのようなものを作る
- `controller.signal` を fetch に渡すと、そのリクエストが中止ボタンに紐づく
- `controller.abort()` を呼ぶと、fetch は **`AbortError` で reject される**
- `controller.signal.aborted` で、中止されたかどうかを確認できる

> **注意** abort すると fetch は reject されるので、`.catch` に来ます。これをエラーとして画面に表示してはいけません。`signal.aborted` を確認して無視します。また、abort が間に合わず成功が返ってきた場合のために、`.then` 側でも `aborted` を確認しておくと確実です。

## その effect、本当に必要？

useEffect は強力ですが、**不要な場面で使われがち**です。React 公式ドキュメントにも「You Might Not Need an Effect」という専用のページがあります。

```tsx bad
// state から計算できる値を effect で同期している
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
```

```tsx good
const fullName = `${firstName} ${lastName}`; // レンダー中に計算するだけ
```

| やりたいこと | 正しい場所 |
|---|---|
| state / props から計算できる値 | レンダー中に計算（重ければ useMemo） |
| ユーザー操作に反応する処理（送信、通知） | イベントハンドラ |
| props が変わったら state をリセット | `key` を変えてコンポーネントを作り直す |
| 外部システムとの同期（データ取得、購読、タイマー） | **useEffect** |

## 実務では TanStack Query / SWR

この章のように useEffect でデータ取得を書くと、ローディング・エラー・競合状態・キャンセルを毎回自分で扱う必要があります。さらに実務では、

- 同じデータを複数のコンポーネントで使うときのキャッシュ
- 画面に戻ってきたときの再取得
- エラー時の自動リトライ
- 更新後のキャッシュの無効化

なども必要になります。そのため実務では **TanStack Query** や **SWR** といったデータ取得ライブラリを使うのが一般的です。

```tsx
const { data, isPending, error } = useQuery({
  queryKey: ["user", userId],
  queryFn: ({ signal }) => fetchUser(userId, signal),
});
```

ただし、ライブラリが内部で何をしてくれているかを理解するために、一度は自分で書く経験が重要です（それがこの課題です）。

## 課題に入る前に

- 状態は判別可能なユニオンで（loading / success / error）
- effect の中で `new AbortController()` を作り、`fetchUser(userId, controller.signal)` に渡す。クリーンアップで `abort()`
- `.then` / `.catch` の両方で `controller.signal.aborted` を確認する
- 「再試行」：effect を再実行させるきっかけになる state（数値を +1 するなど）を作り、依存配列に入れる
- userId が変わったら、すぐ「読み込み中...」に戻す

## 面接で聞かれたら

<details>
<summary>Q. useEffect の依存配列：省略 / [] / [userId] の違いは？</summary>

省略すると毎回のレンダー後に実行されます。空配列だとマウント時に1回だけ実行され、クリーンアップはアンマウント時に実行されます。[userId] のように値を入れると、マウント時と、userId が前回から変わったときに再実行されます。依存配列には effect の中で使っている、変化しうる値をすべて入れるのが原則で、いつ実行したいかで調整するものではありません。

</details>

<details>
<summary>Q. クリーンアップ関数はいつ実行されますか？</summary>

依存配列の値が変わって effect が再実行される直前と、コンポーネントがアンマウントされるときです。前の effect で登録したイベントリスナーやタイマー、進行中のリクエストを片付けるのに使います。必ず「前の effect の後片付け → 次の effect」の順になるので、古いリクエストを abort して競合状態を防ぐこともできます。

</details>

<details>
<summary>Q. 開発時に StrictMode で effect が2回走るのはなぜ？ どう対処すべき？</summary>

クリーンアップが正しく実装されているかを検出するために、React が開発時だけマウント直後にアンマウントと再マウントをシミュレートしているからです。正しくクリーンアップしていれば1回目は片付けられ、ユーザーから見た挙動は変わりません。2回走って問題が起きるならクリーンアップが漏れているバグなので、StrictMode を外したり ref で1回に制限したりするのではなく、クリーンアップを正しく書いて対処すべきです。

</details>

<details>
<summary>Q. 競合状態とは？ 対策は？</summary>

複数の非同期処理の完了順が開始順と一致しないために、古い結果が新しい結果を上書きしてしまう問題です。例えば userId を素早く切り替えたとき、前のリクエストのほうが後に返ってくると、表示中の userId と違うユーザーが表示されます。対策は、effect のクリーンアップで ignore フラグを立てて古い結果を無視するか、AbortController で古いリクエスト自体を中止することです。後者は無駄な通信も止められます。

</details>

<details>
<summary>Q. 実務で useEffect で fetch を書かず TanStack Query / SWR を使う理由は？</summary>

ローディング・エラー状態の管理、競合状態やキャンセルの処理を毎回書かずに済むうえ、キャッシュ、複数コンポーネントでの重複リクエストの排除、再フォーカス時の再取得、リトライ、更新後のキャッシュ無効化など、自前で書くと複雑になる機能が揃っているからです。サーバーのデータを「キャッシュ」として扱う設計になっていて、コンポーネントの state とサーバー state を分けて考えられるのも利点です。

</details>

## 理解度チェック

<details>
<summary>1. 次のコードは何が問題？</summary>

```tsx
useEffect(() => {
  setCount(count + 1);
});
```

依存配列が無いので毎レンダー後に実行され、setCount で再レンダー → また effect → また setCount…と**無限ループ**します。

</details>

<details>
<summary>2. 依存配列に <code>{ id: userId }</code> のようなオブジェクトを props として受け取って入れたら？</summary>

親が `<Child filter={{ id: userId }} />` のようにレンダーのたびに新しいオブジェクトを作っていると、中身が同じでも参照が毎回変わるので、effect が毎回実行されます。依存配列にはプリミティブ（`filter.id`）を入れるか、親側で useMemo を使います。

</details>
