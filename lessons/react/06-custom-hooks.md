# カスタムフック

## この章で学ぶこと

- カスタムフックとは何か、普通の関数との違い
- フックのルールと、その理由
- `useCallback` で関数の参照を安定させる（入門）
- 値を debounce するフック
- `useState` の遅延初期化
- `localStorage` と同期するフック
- `renderHook` によるフックのテスト

## カスタムフック = フックを使う関数

**名前が `use` で始まり、中で他のフックを使っている関数**がカスタムフックです。コンポーネントからロジック（state と effect の組み合わせ）を切り出して、再利用できるようにします。

```tsx
// ウィンドウ幅を返すフック
function useWindowWidth(): number {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

// 使う側は1行で済む
function Layout() {
  const width = useWindowWidth();
  return width < 768 ? <MobileLayout /> : <DesktopLayout />;
}
```

コンポーネントは「何をしたいか（ウィンドウ幅が欲しい）」だけを書き、「どうやって（イベントの登録と解除）」はフックに隠せます。

### 普通の関数と何が違う？

- **中でフック（useState など）を使える**のはコンポーネントとカスタムフックだけ。普通の関数の中ではフックを呼べない
- `use` で始まる名前にすることで、React（と lint ツール）が「これはフックだ」と認識し、フックのルールをチェックできる

逆に言えば、**中でフックを使わないなら、`use` を付けずに普通の関数にすべき**です。

### state は共有されない

```tsx
function A() {
  const width = useWindowWidth(); // A 専用の state
}
function B() {
  const width = useWindowWidth(); // B 専用の state（A とは別物）
}
```

カスタムフックは「**state を持つロジックの再利用**」であって、「**state そのものの共有**」ではありません。呼び出すたびに独立した state が作られます。複数のコンポーネントで同じ state を共有したいなら、親に持ち上げる（R-04）か Context（R-08）を使います。

## フックのルール

フックには2つのルールがあります。

1. **トップレベルでのみ呼ぶ**：条件分岐・ループ・ネストした関数の中で呼ばない
2. **React の関数（コンポーネントかカスタムフック）の中でのみ呼ぶ**

```tsx bad
function Profile({ userId }: { userId?: number }) {
  if (!userId) return <p>未選択</p>; // ← この早期 return より後にフックがある
  const [user, setUser] = useState(null); // userId の有無で、呼ばれたり呼ばれなかったりする
}
```

### なぜこのルールがあるのか

React は、フックを**呼ばれた順番**で識別しています。名前で管理しているわけではありません。

```text
1回目のレンダー:  useState(A) → useState(B) → useEffect(C)
                  [0番目]       [1番目]       [2番目]
2回目のレンダー:  同じ順番で呼ばれるので、0番目の state を A に返せる
```

条件分岐の中でフックを呼ぶと、レンダーによって呼ばれる数や順番が変わり、**別のフックの state を返してしまう**ことになります。だから「毎回必ず同じ順番で呼ばれる」ことを保証するため、トップレベルでしか呼べないのです。

```tsx good
function Profile({ userId }: { userId?: number }) {
  const [user, setUser] = useState(null); // フックは全部先に呼ぶ
  if (!userId) return <p>未選択</p>; // 早期 return はフックの後
}
```

## useCallback：関数の参照を安定させる

カスタムフックが関数を返すとき、気をつけたいことがあります。

```tsx
function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = () => setValue((v) => !v); // レンダーのたびに新しい関数が作られる
  return [value, toggle] as const;
}
```

コンポーネント（とフック）の中で定義した関数は、**レンダーのたびに新しい関数オブジェクト**になります。中身は同じでも `===` で比較すると別物です。

これは普段は問題ありませんが、その関数を `useEffect` の依存配列に入れたり、`React.memo` した子に渡したりすると、毎回「変わった」と判定されてしまいます（R-09 で詳しく）。

`useCallback` で包むと、**依存配列の値が変わらない限り、同じ関数を返し続けます**。

```tsx
const toggle = useCallback(() => setValue((v) => !v), []); // 常に同じ関数
```

- `setValue` は React が「参照が変わらない」ことを保証しているので、依存配列に入れなくて大丈夫です
- **関数型アップデート**（`v => !v`）にしているのがポイント。`setValue(!value)` と書くと `value` に依存するので、依存配列に `value` が必要になり、value が変わるたびに関数が作り直されます

> **ポイント** 他の人が使う汎用的なカスタムフックが関数を返すときは、useCallback で包んでおくのがマナーです。使う側が依存配列に入れても問題が起きないようにするためです。

### as const で戻り値をタプルにする

```tsx
return [value, toggle]; // (boolean | (() => void))[] と推論される → 使う側で型が崩れる
return [value, toggle] as const; // readonly [boolean, () => void]
```

配列を返すフックでは、`as const` か戻り値の型注釈でタプル型にします。

## 値を debounce するフック

TS-10 では「関数を debounce する」方法を学びました。React では、**値そのものを debounce する**フックのほうが扱いやすいことが多いです。

```tsx
function SearchBox() {
  const [text, setText] = useState("");
  const debouncedText = useDebouncedValue(text, 300); // 入力が止まって 300ms 後に追いつく

  useEffect(() => {
    if (debouncedText) search(debouncedText); // 打ち終わってから検索
  }, [debouncedText]);

  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}
```

入力欄は `text` で即座に反映しつつ、検索には `debouncedText` を使います。

実装の考え方は、TS-10 の debounce と同じ「変わるたびにタイマーを張り直す」です。React では「値が変わるたびに」が **useEffect の依存配列**、「前のタイマーを消す」が **クリーンアップ** に対応します。

```text
value: "a"   → effect: 300ms 後に debounced を "a" にするタイマー
value: "ab"  → cleanup: "a" のタイマーを消す → effect: "ab" のタイマー
（300ms 何もない）→ debounced が "ab" になる
```

## useState の遅延初期化

```tsx
const [data, setData] = useState(loadFromStorage()); // ← 毎レンダー loadFromStorage() が実行される
```

`useState` の初期値は最初のレンダーでしか使われませんが、引数の式 `loadFromStorage()` は**毎回のレンダーで評価されます**（関数の引数なので、呼ぶ前に評価される）。結果が捨てられるだけで、重い処理が毎回走ります。

**関数を渡すと、最初のレンダーでだけ呼ばれます**。

```tsx
const [data, setData] = useState(() => loadFromStorage()); // 初回だけ実行
```

localStorage の読み込み、JSON のパース、大きな配列の生成など、少しでもコストがある初期化には遅延初期化を使いましょう。

## localStorage と同期する

`localStorage` は文字列しか保存できないので、JSON に変換して保存します。

```ts
localStorage.setItem("settings", JSON.stringify({ theme: "dark" }));
const raw = localStorage.getItem("settings"); // 無ければ null
const settings = raw === null ? defaults : JSON.parse(raw); // 壊れていたら例外！
```

外部のデータなので、TS-07 と同じく**壊れている可能性**を考慮します（ユーザーが手で書き換えた、古いバージョンの形式が残っている、など）。

### state と localStorage を同期させる設計

`useState` と同じ使い勝手で、値が localStorage にも保存されるフックを作るには、

1. **初期値**: 遅延初期化で localStorage から読む（無い・壊れている → 引数の初期値）
2. **保存**: 値が変わるたびに書き込む

保存の方法は2つ考えられます。

- setter をラップして、set するときに一緒に保存する → 関数型アップデート（`prev => ...`）に対応させるのが少し面倒
- **useEffect で value を監視して保存する** → setter は useState のものをそのまま返せる。関数型アップデートも自然に動く

これは useEffect の正しい使い方です。「React の state」と「外部システム（localStorage）」を**同期させている**からです。

> **注意** Next.js などのサーバーサイドレンダリング（SSR）では、サーバー上に `window` も `localStorage` も無いため、初期化で直接触るとエラーになります。`typeof window === "undefined"` のチェックが必要です。この課題はブラウザ（jsdom）だけで動くので不要です。

## フックをテストする：renderHook

カスタムフックは、コンポーネントの外では呼べません。Testing Library の `renderHook` は、フックを呼ぶだけのテスト用コンポーネントを内部で作ってくれます。

```tsx
const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
  initialProps: { value: "a" },
});

result.current; // フックの最新の戻り値
rerender({ value: "ab" }); // 新しい引数で再レンダー

act(() => result.current[1]()); // state を更新する操作は act で包む
```

`act` は「この中で起きた state 更新と effect を、全部反映し終わるまで待つ」ための関数です。

## 課題に入る前に

- **useToggle**: `useCallback` + 関数型アップデート。戻り値の3番目は setter そのもの
- **useDebouncedValue**: debounce 後の値を state に持ち、useEffect + setTimeout + クリーンアップ
- **useLocalStorage**: 遅延初期化（try/catch で JSON.parse）+ useEffect で保存
- いずれも 10〜15 行程度で書けます

## 面接で聞かれたら

<details>
<summary>Q. カスタムフックと普通の関数の違いは？ なぜ use で始める必要がある？</summary>

カスタムフックは中で useState や useEffect などのフックを使える関数で、state や副作用を含むロジックを再利用するために使います。普通の関数の中ではフックを呼べません。use で始める命名は、React や eslint-plugin-react-hooks がフックだと認識してフックのルールをチェックするための規約です。中でフックを使わないなら、use を付けずに普通の関数にすべきです。

</details>

<details>
<summary>Q. フックのルールとその理由は？</summary>

フックはコンポーネントかカスタムフックのトップレベルでのみ呼び、条件分岐やループ、ネストした関数の中で呼んではいけません。React はフックを名前ではなく呼ばれた順番で識別して state を対応付けているので、レンダーごとに呼ばれる順番や数が変わると、別のフックの state を返してしまうからです。

</details>

<details>
<summary>Q. 2つのコンポーネントで同じカスタムフックを使うと state は共有される？</summary>

共有されません。カスタムフックは state を持つロジックを再利用する仕組みで、呼び出すごとに独立した state が作られます。複数のコンポーネントで同じ state を使いたい場合は、共通の親に state を持ち上げて props で渡すか、Context や状態管理ライブラリを使います。

</details>

<details>
<summary>Q. useState(() => ...) の遅延初期化とは？ いつ使う？</summary>

useState に関数を渡すと、その関数は最初のレンダーでだけ呼ばれ、戻り値が初期値になります。値を直接渡すと、初期値は初回しか使わないのに、引数の式は毎レンダー評価されてしまいます。localStorage の読み込みや JSON のパース、大きなデータの生成など、初期値の計算にコストがかかるときに使います。

</details>

## 理解度チェック

<details>
<summary>1. useToggle の toggle を <code>useCallback(() =&gt; setValue(!value), [])</code> と書いたら？</summary>

依存配列が空なので最初のレンダーの `value`（false）を閉じ込めたままになり、何度押しても `setValue(!false)` = true にしかなりません（古いクロージャ問題）。関数型アップデート `setValue((v) => !v)` にするのが正解です。

</details>

<details>
<summary>2. useDebouncedValue でクリーンアップを書き忘れると？</summary>

値が変わるたびにタイマーが追加され、前のタイマーも消されないので、入力した途中の値すべてが 300ms 遅れで順番に反映されます。「最後の値だけ」にならず、debounce になりません。

</details>
