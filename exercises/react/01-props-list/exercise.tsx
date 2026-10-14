/**
 * R-01 ★ props の型定義・リスト描画・key・イベント
 *
 * 【課題】 UserList コンポーネントを作る。
 * - props: users（User の配列）、onSelect（ユーザーがクリックされたら呼ぶ。省略可能）
 * - users を <ul> の <li> として並べる。各 <li> にはユーザー名を表示
 * - role が "admin" のユーザーには名前の横に <span>管理者</span> を表示
 * - users が空なら <ul> は出さず <p>ユーザーがいません</p> を表示
 * - <li> 内の <button>（テキストはユーザー名）をクリックしたら onSelect(user) を呼ぶ
 * - 見出し <h2> に「ユーザー一覧（N人）」と表示する（空のときも表示）
 *
 * 【ルール】 Props の型を自分で定義すること。key に配列の index を使わないこと。
 *
 * 【面接で聞かれること】
 * - key はなぜ必要？ index を key にすると何が起きる？（並べ替え・削除時に state がずれる）
 * - props を子が変更してはいけないのはなぜ？（単方向データフロー）
 * - `onSelect?.(user)` の ?. は何？
 * - React.FC を使う／使わない、どちらが好み？ 理由は？
 */

export interface User {
  id: number;
  name: string;
  role: "admin" | "member";
}

export function UserList(props: any) {
  // TODO
  return null;
}
