/**
 * R-04 ★ 配列 state のイミュータブルな更新・派生データ（Todo アプリ）
 *
 * 【課題】 TodoApp コンポーネントを作る。
 * - 「新しいタスク」というラベルの入力欄と「追加」ボタン（form で囲み Enter でも追加）
 *     - 前後の空白を除いて空ならば追加しない
 *     - 追加したら入力欄を空にする
 * - タスクは <li> で表示。各 <li> に
 *     - チェックボックス（アクセシブルネームはタスク名。<label> で囲む）→ 完了/未完了を切り替え
 *     - 削除ボタン（aria-label は「{タスク名}を削除」）
 * - フィルタボタン「すべて」「未完了」「完了」で表示を絞り込む
 *     - 選択中のボタンには aria-pressed="true"、それ以外は "false"
 * - 「残り N 件」と未完了の件数を表示（フィルタに関係なく全体の未完了数）
 * - props の initialTodos（省略可）を初期値にする
 *
 * 【ルール】
 * - state を直接変更しない（push / splice / todo.done = true は禁止）
 * - 「表示用のリスト」や「残り件数」を state に持たない（todos と filter から毎回計算する）
 *
 * 【面接で聞かれること】
 * - なぜ state をイミュータブルに更新する必要がある？（参照が変わらないと再レンダーされない／比較できない）
 * - 派生データを state にすると何が問題？（同期ズレ。Single Source of Truth）
 * - id の生成に Date.now() / Math.random() / crypto.randomUUID() を使う場合の注意点
 */

export interface Todo {
  id: string;
  title: string;
  done: boolean;
}

export function TodoApp(props: { initialTodos?: Todo[] }) {
  // TODO
  return null;
}
