/**
 * R-02 ★ useState と関数型アップデート
 *
 * 【課題】 Counter コンポーネントを作る。
 * - props: initial（初期値、省略時 0）、min（省略時 -Infinity）、max（省略時 Infinity）、step（省略時 1）
 * - 現在値を data-testid="count" の要素に表示
 * - ボタン「-」「+」で step ずつ増減。min / max を超えない（超える場合は境界値で止める）
 * - 値が min なら「-」を、max なら「+」を disabled にする
 * - ボタン「+3」: 1回のクリックで「+」を3回押したのと同じ結果にする（max を超えないこと）
 *   ※まず `setCount(count + step)` を3回呼ぶ素朴な実装を書いてテストが落ちるのを確認し、
 *     なぜ落ちるのかを説明できるようになってから直すこと
 * - ボタン「リセット」で initial に戻す
 * - ユーザー操作で値が変わったら props の onChange?.(新しい値) を1回呼ぶ（初回表示時は呼ばない）
 *
 * 【面接で聞かれること】
 * - setCount(count + 1) を3回呼んでも +1 にしかならないのはなぜ？（同じレンダーの count を参照している）
 * - setCount(c => c + 1) はなぜ解決になる？
 * - state を更新しても直後の console.log(count) が古い値なのはなぜ？
 * - onChange を「useEffect で count を監視して呼ぶ」方法と「イベントハンドラ内で呼ぶ」方法、どちらが良い？
 *   （公式ドキュメントはハンドラ内を推奨: You Might Not Need an Effect）
 */

export function Counter(props: any) {
  // TODO
  return null;
}
