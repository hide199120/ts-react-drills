/**
 * R-10 ★★★ 総合: インクリメンタルサーチ
 *
 * これまでの課題（制御コンポーネント・debounce・useEffect・AbortController・判別可能なユニオン）を組み合わせる。
 * 「この画面をライブコーディングで作ってください」は実際の面接でもよく出る。
 *
 * 【課題】 UserSearch コンポーネントを作る。
 * - props: searchUsers(query, signal) => Promise<SearchUser[]>
 * - 「検索」というラベルの入力欄
 * - 入力が止まってから 300ms 後に、前後の空白を除いた文字列で searchUsers を呼ぶ
 *   - 入力中（300ms 以内に次の入力がある）は呼ばない
 *   - 空文字（空白のみ含む）のときは呼ばず、結果エリアには何も表示しない
 * - 検索中は「検索中...」
 * - 成功:
 *   - 結果があれば「N件」と、<ul> に <li> で「{name}（{department}）」を表示
 *   - 0件なら「該当するユーザーはいません」
 * - 失敗: role="alert" で「検索に失敗しました」
 * - 新しい検索が始まったら、前の検索は abort する（古い結果を表示しない）
 * - 「クリア」ボタンで入力欄と結果を空に戻す（入力が空のときは disabled）
 *
 * 【自分で考えるポイント】
 * - debounce は R-06 の useDebouncedValue を自分で書き直して使ってOK（import はしないこと）
 * - 状態をどう型で表すか（idle / loading / success / error）
 * - 「クリア」直後に、保留中の debounce が発火して検索が走らないか？
 *
 * 【面接で聞かれること】
 * - debounce 中の値と、実際に検索に使う値を分けて持つ理由
 * - URL のクエリパラメータと検索状態を同期させるなら？
 * - アクセシビリティ: 結果件数の変化をスクリーンリーダーに伝えるには？（aria-live）
 */

export interface SearchUser {
  id: number;
  name: string;
  department: string;
}

export interface UserSearchProps {
  searchUsers: (query: string, signal: AbortSignal) => Promise<SearchUser[]>;
}

export function UserSearch(props: UserSearchProps) {
  // TODO
  return null;
}
