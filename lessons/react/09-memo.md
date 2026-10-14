# 再レンダーの最適化

## この章で学ぶこと

- コンポーネントが再レンダーされる3つの条件
- 再レンダー ≠ DOM の更新
- `React.memo` で props が同じなら再レンダーをスキップする
- `useCallback` / `useMemo` で参照を安定させる
- 3つを組み合わせて初めて効く理由
- メモ化せずに解決する方法（state を下ろす、children で渡す）
- いつ最適化すべきか、React Compiler

## 再レンダーが起きる3つの条件

コンポーネントが再レンダー（関数が再実行）されるのは、次のどれかが起きたときです。

1. **自分の state が更新された**
2. **親が再レンダーされた**
3. **使っている Context の値が変わった**

2つ目が重要です。**props が変わったかどうかに関係なく、親が再レンダーされると、子もすべて再レンダーされます**。

```tsx
function Parent() {
  const [text, setText] = useState("");
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <HeavyList items={items} /> {/* text と無関係なのに、1文字打つたびに再レンダー */}
    </>
  );
}
```

### 再レンダーは悪ではない

再レンダーは「関数を実行して JSX を計算し直す」ことで、**DOM が更新されるとは限りません**。React は新旧の JSX を比較して、違う部分だけを DOM に反映します。DOM の操作に比べれば JSX の計算は軽いので、**ほとんどの再レンダーは問題になりません**。

問題になるのは、

- 再レンダーされるコンポーネントの数が非常に多い（数百〜数千行のリスト）
- 1回のレンダーで重い計算をしている
- 入力のたびに走ることで、体感でわかるほど遅くなっている

という場合です。

## React.memo：props が同じならスキップ

`memo` で包んだコンポーネントは、**親が再レンダーされても、props が前回と同じなら再レンダーをスキップ**します。

```tsx
import { memo } from "react";

const Row = memo(function Row({ item }: { item: Item }) {
  return <li>{item.name}</li>;
});
```

props の比較は、**各 props を `Object.is`（ほぼ `===`）で比べる浅い比較**です。プリミティブ（文字列や数値）なら値で比較されますが、**オブジェクト・配列・関数は参照で比較されます**。

## memo が効かない理由：毎回新しい参照

```tsx
function List({ items }: { items: Item[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => setSelectedId(id); // ← レンダーのたびに新しい関数

  return items.map((item) => (
    <Row key={item.id} item={item} onSelect={handleSelect} /> // Row が memo でも毎回再レンダー
  ));
}
```

`handleSelect` はレンダーのたびに新しく作られる関数なので、`Row` から見ると「`onSelect` が変わった」ことになり、**memo しても毎回再レンダーされます**。

同じことが、レンダー中に作るオブジェクトや配列にも起きます。

```tsx
<Row style={{ color: "red" }} />       {/* 毎回新しいオブジェクト */}
<Row items={items.filter(isActive)} /> {/* 毎回新しい配列 */}
```

## useCallback：関数の参照を保つ

`useCallback` は、**依存配列が変わらない限り、同じ関数を返し続けます**（R-06 で少し登場しました）。

```tsx
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []); // setSelectedId は安定しているので依存なし → 常に同じ関数
```

state の値を使う必要がある場合も、**関数型アップデート**にすれば依存を増やさずに済みます。

```tsx
// ✕ count に依存 → count が変わるたびに新しい関数
const increment = useCallback(() => setCount(count + 1), [count]);
// ○ 依存なし → 常に同じ関数
const increment = useCallback(() => setCount((c) => c + 1), []);
```

## useMemo：計算結果を保つ

`useMemo` は、**依存配列が変わらない限り、前回の計算結果を返します**。用途は2つです。

```tsx
// 1. 重い計算をスキップする
const sorted = useMemo(() => expensiveSort(items, sortKey), [items, sortKey]);

// 2. オブジェクト・配列の参照を保つ（memo した子や、依存配列に渡すため）
const options = useMemo(() => ({ pageSize: 20, sortKey }), [sortKey]);
```

`useCallback(fn, deps)` は `useMemo(() => fn, deps)` と同じ意味です。関数専用の useMemo だと思ってください。

## 3つは組み合わせて初めて効く

ここが一番大事なポイントです。

| やったこと | 結果 |
|---|---|
| 子を `memo` しただけ | 親から渡す関数・配列が毎回新しいので、**効かない** |
| 関数を `useCallback` しただけ | 子が memo されていないので、親が再レンダーされれば子も再レンダー。**効かない** |
| `memo` + `useCallback` + `useMemo` | props がすべて同じ参照になり、**スキップされる** |

```text
親が再レンダー
  ↓
子は memo されている？ ── No → 再レンダー
  ↓ Yes
props は全部 Object.is で同じ？ ── No → 再レンダー
  ↓ Yes                          （関数は useCallback、配列・オブジェクトは useMemo で保つ）
スキップ！
```

### props の渡し方も工夫する

```tsx bad
<Row item={item} selectedId={selectedId} /> // 選択が変わると全行の selectedId が変わる → 全行再レンダー
```

```tsx good
<Row item={item} selected={item.id === selectedId} /> // boolean なら、変化した2行だけ再レンダー
```

**子が本当に必要な最小限の情報**を渡すと、memo の効果が最大になります。

## メモ化せずに解決する方法

memo を使う前に、**コンポーネントの構造を変えるだけで解決できないか**を考えましょう。

### 方法1：state を下に移す

```tsx bad
function Page() {
  const [text, setText] = useState(""); // Page 全体の state
  return (
    <>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <HeavyList /> {/* text が変わるたびに再レンダー */}
    </>
  );
}
```

```tsx good
function SearchInput() {
  const [text, setText] = useState(""); // 使う場所に閉じ込める
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}

function Page() {
  return (
    <>
      <SearchInput /> {/* 入力で再レンダーされるのはここだけ */}
      <HeavyList />
    </>
  );
}
```

### 方法2：children として渡す

```tsx
function ScrollTracker({ children }: { children: ReactNode }) {
  const [y, setY] = useState(0); // スクロールのたびに更新
  // ...
  return <div>{children}</div>; // children は親が作った要素なので、再レンダーされない
}

<ScrollTracker>
  <HeavyContent />
</ScrollTracker>;
```

`ScrollTracker` の state が変わっても、`children`（`<HeavyContent />`）は親が作った要素で、参照が変わらないので再レンダーされません（R-08 の理解度チェックと同じ仕組み）。

## いつ最適化すべきか

メモ化にもコストがあります。

- 依存配列の比較と、前回の値の保持にコストがかかる
- コードが読みにくくなる
- 依存配列の書き間違いで、古い値を使うバグを生む

そのため、

1. **まず計測する**：React DevTools の Profiler で、どのコンポーネントが何回・何ミリ秒レンダーされているかを確認する
2. **構造で解決できないか考える**：state を下ろす、children で渡す
3. **それでも遅いところだけメモ化する**

という順番が推奨されます。「とりあえず全部 useCallback」は避けましょう。

例外として、汎用的なカスタムフックが返す関数や、Context の value（R-08）は、使う側が依存配列に入れることを想定してメモ化しておくのが一般的です。

### React Compiler

**React Compiler** は、ビルド時にコードを解析して、必要なメモ化（memo / useMemo / useCallback 相当）を**自動で挿入**してくれるツールです。導入すれば、手でメモ化を書く場面はかなり減ります。

ただし、「なぜ再レンダーが起きるのか」「なぜ参照の安定が必要なのか」の理解は、Compiler が最適化できないコード（ルール違反のコード）に気づくためにも、面接で答えるためにも必要です。

## レンダー回数を測るテスト

課題 R-09 のテストは、行コンポーネントの中で `onRender` を呼んでもらい、その回数を数えています。

```tsx
const onRowRender = vi.fn();
render(<SelectableList items={items} onRowRender={onRowRender} />);
expect(onRowRender).toHaveBeenCalledTimes(3); // 初回は3行で3回

await user.type(screen.getByLabelText("メモ"), "hello");
expect(onRowRender).toHaveBeenCalledTimes(3); // メモ入力では1回も増えないこと
```

レンダー中に関数を呼ぶのは、本来は避けるべき副作用ですが、ここでは回数を数えるためだけに使っています（テストは StrictMode なしで実行しています）。

## 課題に入る前に

- 課題のコードは「動くが遅い」状態です。**動作は変えずに**、再レンダーだけを減らします
- 行コンポーネントを `memo` で包む（`export const ItemRow = memo(function ItemRow(...) {...})`）
- 選択のハンドラを `useCallback` で安定させる
- 並べ替えた配列を `useMemo` で保つ（依存配列に何を入れるか考える。`sort` 関数も props です）
- 3つのうちどれか1つを外すと、どのテストが落ちるかを試すと理解が深まります

## 面接で聞かれたら

<details>
<summary>Q. React が再レンダーする条件は？</summary>

コンポーネント自身の state が更新されたとき、親コンポーネントが再レンダーされたとき、使っている Context の値が変わったときの3つです。特に、親が再レンダーされると、props が変わっていなくても子はすべて再レンダーされます。ただし再レンダーは関数の再実行であって、DOM は差分がある部分しか更新されないので、多くの場合は問題になりません。

</details>

<details>
<summary>Q. React.memo はどう比較しますか？</summary>

前回と今回の props を、それぞれのプロパティごとに Object.is で比較する浅い比較です。すべて同じなら再レンダーをスキップします。プリミティブは値で比較されますが、オブジェクト、配列、関数は参照で比較されるので、親がレンダーのたびに新しく作っていると、中身が同じでも毎回再レンダーされます。第2引数に独自の比較関数を渡すこともできます。

</details>

<details>
<summary>Q. useCallback を付けても子が memo されていなければ意味がないのはなぜ？</summary>

memo されていない子は、親が再レンダーされると props に関係なく必ず再レンダーされるからです。useCallback は関数の参照を保つだけで、それ自体が再レンダーを止めるわけではありません。memo した子に渡す、useEffect の依存配列に入れる、といった参照の比較が行われる場面で初めて意味を持ちます。

</details>

<details>
<summary>Q. 何でもメモ化すれば良いですか？</summary>

良くないと考えています。メモ化には依存の比較や値の保持のコストがあり、コードも読みにくくなり、依存配列の誤りでバグも生みます。まず Profiler で計測して、実際に遅い箇所を特定し、state を使う場所に下ろしたり children で渡したりする構造の改善で解決できないかを検討してから、必要な箇所だけメモ化します。なお React Compiler を導入すると、メモ化は自動で行われるようになります。

</details>

<details>
<summary>Q. メモ化せずに再レンダーを減らす方法は？</summary>

1つは state を下に移すことで、入力欄の文字のように一部でしか使わない state を、それを使う小さなコンポーネントに閉じ込めれば、再レンダーの範囲がそのコンポーネントだけになります。もう1つは children として渡すことで、state を持つコンポーネントが再レンダーされても、children は親が作った要素なので参照が変わらず再レンダーされません。

</details>

## 理解度チェック

<details>
<summary>1. memo した子に <code>onClick={() =&gt; select(item.id)}</code> と渡すと？</summary>

アロー関数がレンダーのたびに新しく作られるので、memo が効きません。子に `onSelect={handleSelect}`（useCallback した関数）と `id={item.id}` を渡し、子の中で `onClick={() => onSelect(id)}` と呼ぶようにします。

</details>

<details>
<summary>2. useMemo の依存配列に、レンダー中に作った配列を入れると？</summary>

```tsx
const filters = [a, b];
const result = useMemo(() => compute(filters), [filters]);
```

`filters` は毎回新しい配列なので、毎回再計算されて useMemo の意味がありません。依存配列には `[a, b]` を直接入れます。

</details>
