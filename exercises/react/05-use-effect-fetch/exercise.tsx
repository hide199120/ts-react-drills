/**
 * R-05 ★★ useEffect でのデータ取得・クリーンアップ・競合状態（race condition）
 *
 * 【課題】 UserProfile コンポーネントを作る。
 * - props: userId と fetchUser(id, signal) => Promise<User>
 *   （テストしやすいよう fetch 関数を props で受け取る。実務なら fetch(`/api/users/${id}`, { signal }) 相当）
 * - 取得中は「読み込み中...」を表示
 * - 成功したら <h2>{name}</h2> と <p>{email}</p> を表示
 * - 失敗したら role="alert" で「エラー: {メッセージ}」を表示し、「再試行」ボタンを出す
 *   - 再試行を押すと再取得する
 * - userId が変わったら取得し直す
 * - 【重要】 userId を素早く切り替えたとき、古いリクエストの結果で新しい結果を上書きしないこと
 *   - 古いリクエストには AbortController で abort() を送ること（signal.aborted が true になる）
 *   - abort による失敗はエラー表示しないこと
 * - アンマウント時も進行中のリクエストを abort すること
 *
 * 【面接で聞かれること】
 * - useEffect の依存配列: 省略 / [] / [userId] の違い
 * - クリーンアップ関数はいつ実行される？（次の effect 実行前とアンマウント時）
 * - 開発時の StrictMode で effect が2回走るのはなぜ？ どう対処すべき？
 * - 競合状態とは？ 対策は？（ignore フラグ / AbortController）
 * - 実務で useEffect で fetch を書かず TanStack Query / SWR を使う理由
 */

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserProfileProps {
  userId: number;
  fetchUser: (id: number, signal: AbortSignal) => Promise<User>;
}

export function UserProfile(props: UserProfileProps) {
  // TODO
  return null;
}
