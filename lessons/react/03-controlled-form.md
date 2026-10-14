# フォームと制御コンポーネント

## この章で学ぶこと

- 制御コンポーネント（controlled component）：`value` + `onChange`
- 非制御コンポーネント：`useRef` / `FormData`
- イベントの型（`ChangeEvent` / `FormEvent`）
- `onSubmit` と `preventDefault`
- 複数の入力欄をまとめて管理する
- バリデーションとエラー表示
- `label` とアクセシビリティ、`useId`

## 制御コンポーネント

入力欄の値を **state で管理し、`value` と `onChange` で結びつける**書き方を制御コンポーネントと呼びます。

```tsx
function NameInput() {
  const [name, setName] = useState("");

  return (
    <input
      value={name} // 表示する値は常に state
      onChange={(e) => setName(e.target.value)} // 入力されたら state を更新
    />
  );
}
```

入力のたびに次のことが起きます。

1. ユーザーがキーを押す
2. `onChange` が呼ばれ、`setName` で state を更新
3. 再レンダーされ、`value={name}` で新しい値が表示される

**「入力欄に表示される値」の唯一の情報源が state** になるので、

- 入力値をリアルタイムに加工・表示できる（文字数カウント、大文字化など）
- プログラムから値を変更できる（送信後にクリア、初期値の設定）
- 入力中にバリデーションできる

といったことが簡単にできます。

> **注意** `value` を指定して `onChange` を書き忘れると、入力しても何も変わらない（読み取り専用の）入力欄になり、コンソールに警告が出ます。

### チェックボックスとセレクト

```tsx
<input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />

<select value={plan} onChange={(e) => setPlan(e.target.value)}>
  <option value="free">無料</option>
  <option value="pro">有料</option>
</select>
```

チェックボックスは `value` ではなく `checked` を使います。

## イベントの型

ハンドラを別の関数に切り出すときは、イベントの型が必要です。

```tsx
import type { ChangeEvent, FormEvent } from "react";

const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  setName(e.target.value);
};

const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};
```

型名を覚えていなくても、JSX の中に `onChange={(e) => ...}` と書いて `e` にホバーすれば型がわかります。

## フォームの送信

```tsx
function SearchForm({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // ページのリロードを止める
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit">検索</button>
    </form>
  );
}
```

### なぜ button の onClick ではなく form の onSubmit なのか

- 入力欄で **Enter キーを押したときも送信される**（ブラウザ標準の動き）
- スクリーンリーダーなどの支援技術が「フォーム」として認識できる
- `required` などの HTML 標準バリデーションも働く

### preventDefault を呼ばないと

`<form>` の送信は、ブラウザ標準では**ページ遷移（リロード）**を伴います。`preventDefault()` を呼ばないと、ページがリロードされて state がすべて消えます。

### noValidate

`type="email"` や `required` を付けると、ブラウザが独自のバリデーション（吹き出しのエラー）を出します。自前のバリデーションとエラー表示を使いたいときは、`<form noValidate>` でブラウザの検証を無効にします。

## 複数の入力欄を管理する

入力欄ごとに `useState` を書いてもよいですが、数が多いときは1つのオブジェクトにまとめると便利です。

```tsx
const [form, setForm] = useState({ name: "", email: "", message: "" });

const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target; // input の name 属性と入力値
  setForm((prev) => ({ ...prev, [name]: value })); // そのキーだけ更新
};

<input name="email" value={form.email} onChange={handleChange} />
<textarea name="message" value={form.message} onChange={handleChange} />
```

ポイントは2つです。

- `[name]: value` は**計算されたプロパティ名**。変数の値をキーにできる
- `{ ...prev, ... }` でコピーしてから一部を上書き（TS-02 のイミュータブルな更新）

送信後にクリアするなら、初期値を定数にしておいて `setForm(initialForm)` とします。

## バリデーション

### 純粋関数に切り出す

バリデーションのロジックは、**フォームの値を受け取ってエラーを返す純粋関数**にすると、テストしやすく読みやすくなります。

```tsx
type Errors = Partial<Record<"email" | "password", string>>;

function validate(values: { email: string; password: string }): Errors {
  const errors: Errors = {};
  if (!values.email) errors.email = "必須です";
  if (values.password.length < 8) errors.password = "8文字以上にしてください";
  return errors;
}
```

コンポーネントの中では、送信時にこれを呼んで結果を state に入れ、エラーが無ければ送信処理に進みます。

```tsx
const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const found = validate(form);
  setErrors(found);
  if (Object.keys(found).length > 0) return; // エラーがあれば中断
  onSubmit(form);
};
```

### エラーの表示と role="alert"

```tsx
{errors.email && <p role="alert">{errors.email}</p>}
```

`role="alert"` を付けると、スクリーンリーダーが表示された瞬間に読み上げます。テストでも `getByRole("alert")` で見つけられます。

### いつバリデーションするか

| タイミング | 長所 | 短所 |
|---|---|---|
| 送信時 | 実装が簡単。入力中に邪魔しない | 送信するまで間違いに気づけない |
| 入力のたび | すぐ気づける | 入力し始めた瞬間にエラーが出てうるさい |
| フォーカスが外れたとき（onBlur） | バランスが良い | 状態管理が少し複雑（触ったかどうか） |

実務では「最初は送信時、一度エラーが出た欄は入力のたびに再検証」のような組み合わせもよく使います。

## label とアクセシビリティ

入力欄には必ず `<label>` を関連付けます。関連付ける方法は2つです。

```tsx
// 1. htmlFor と id
<label htmlFor="email">メールアドレス</label>
<input id="email" />

// 2. label で囲む
<label>
  メールアドレス
  <input />
</label>
```

関連付けると、

- ラベルをクリックすると入力欄にフォーカスが移る
- スクリーンリーダーが「メールアドレス、編集可能テキスト」と読み上げる
- テストで `getByLabelText("メールアドレス")` で探せる

### useId で一意な id を作る

`id="email"` と固定で書くと、同じコンポーネントを1ページに2つ置いたときに id が重複します。`useId` を使うと、コンポーネントのインスタンスごとに一意な id が作れます。

```tsx
import { useId } from "react";

function EmailField() {
  const id = useId(); // 例: ":r0:"
  return (
    <>
      <label htmlFor={`${id}-email`}>メールアドレス</label>
      <input id={`${id}-email`} type="email" />
    </>
  );
}
```

## 非制御コンポーネント

state を使わず、**DOM 自身に値を持たせて、必要なときに読み取る**方法もあります。

```tsx
// useRef で DOM を参照する
function NameForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log(inputRef.current?.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="初期値" />
    </form>
  );
}

// FormData で送信時にまとめて読む
const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  console.log(data.get("email")); // name="email" の値
};
```

初期値は `value` ではなく `defaultValue` で指定します。

| | 制御 | 非制御 |
|---|---|---|
| 値の持ち主 | React の state | DOM |
| 入力中の加工・リアルタイム検証 | 簡単 | 難しい |
| 再レンダー | 入力のたび | 起きない |
| 向いている場面 | 入力に反応する UI | 送信時に読むだけのシンプルなフォーム、ファイル入力 |

> **ポイント** 実務では **React Hook Form**（非制御ベースで再レンダーが少ない）と **zod**（TS-07）を組み合わせることが多いです。また React 19 では `<form action={関数}>` と `useActionState` で、FormData を使ったフォームが書きやすくなりました。ただし、どのライブラリを使うにしても、この章の制御コンポーネントの理解が前提になります。

## 課題に入る前に

- 3つの入力欄の state は、1つのオブジェクトにまとめると楽です（`name` 属性を使う方法）
- バリデーションは純粋関数に切り出し、**エラーメッセージの配列**を返すようにすると、表示が `map` で書けます
- 送信成功時は、`onSubmit` を呼んでから入力欄とエラーの両方をクリア
- 文字数表示は state から計算するだけ（新しい state は不要）
- `<form noValidate>` を忘れずに

## 面接で聞かれたら

<details>
<summary>Q. 制御コンポーネントと非制御コンポーネントの違いと使い分けは？</summary>

制御コンポーネントは入力値を React の state で管理し、value と onChange で結びつけます。値の唯一の情報源が state なので、入力中の加工やリアルタイムのバリデーション、プログラムからの値の変更が簡単です。非制御コンポーネントは値を DOM に持たせ、ref や FormData で必要なときに読み取ります。再レンダーが起きず実装も簡単なので、送信時に値を読むだけのシンプルなフォームやファイル入力に向いています。入力に応じて UI が変わるなら制御、そうでなければ非制御も選択肢、と使い分けます。

</details>

<details>
<summary>Q. e.preventDefault() を呼ばないと何が起きますか？</summary>

form の submit イベントのブラウザ標準の動作として、フォームの action 先へのページ遷移、action が無ければ同じページのリロードが起きます。SPA ではページがリロードされて state がすべて失われてしまうので、onSubmit の中で preventDefault を呼んで標準の動作を止めます。

</details>

<details>
<summary>Q. 入力のたびに再レンダーされるのはパフォーマンス的に問題？</summary>

通常は問題になりません。React は差分だけを DOM に反映するので、フォーム程度の再レンダーは十分速いです。ただし、入力欄が非常に多い巨大なフォームや、同じコンポーネント内に重い描画がある場合は、入力欄を小さなコンポーネントに分けて state をそこに閉じ込めたり、React Hook Form のような非制御ベースのライブラリを使ったりして対策します。まず計測してから最適化すべきだと考えています。

</details>

<details>
<summary>Q. 実務でフォームに React Hook Form + zod を使う理由は？</summary>

React Hook Form は非制御コンポーネントベースで再レンダーが少なく、入力値・エラー・送信中などの状態管理を任せられるので、ボイラープレートが減ります。zod でスキーマを定義すると、バリデーションルールと TypeScript の型を1か所で管理でき、サーバー側と同じスキーマを使い回すこともできます。手書きだと複雑になりがちな「どの欄を触ったか」「いつ再検証するか」なども設定で扱えます。

</details>

## 理解度チェック

<details>
<summary>1. <code>&lt;input value={name} /&gt;</code> だけ書いたらどうなる？</summary>

キーを押しても値が変わらない、読み取り専用の入力欄になります（React が毎回 `name` の値に戻すため）。コンソールに「onChange が無い」という警告も出ます。表示だけなら `readOnly` を付けるか、初期値だけなら `defaultValue` を使います。

</details>

<details>
<summary>2. <code>useState(props.initialName)</code> で、親が initialName を変えたら入力欄は変わる？</summary>

変わりません。useState の初期値は最初のレンダーでしか使われないからです。親の値の変化に合わせてフォームをリセットしたいなら、親側で `<Form key={userId} />` のように key を変えて作り直すのが簡単な方法です。

</details>
