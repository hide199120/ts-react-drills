/**
 * R-01 模範解答
 *
 * ポイント
 * - props は分割代入で受け取り、型は interface / type で定義
 * - 早期 return で「空のとき」を分けるとネストが浅くなる（ここでは見出しを共通で出すため三項演算子）
 * - key には一意で安定した値（id）を使う
 * - onSelect は省略可能なので onSelect?.(user)
 */

export interface User {
  id: number;
  name: string;
  role: "admin" | "member";
}

interface UserListProps {
  users: User[];
  onSelect?: (user: User) => void;
}

export function UserList({ users, onSelect }: UserListProps) {
  return (
    <section>
      <h2>ユーザー一覧（{users.length}人）</h2>
      {users.length === 0 ? (
        <p>ユーザーがいません</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <button type="button" onClick={() => onSelect?.(user)}>
                {user.name}
              </button>
              {user.role === "admin" && <span>管理者</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
