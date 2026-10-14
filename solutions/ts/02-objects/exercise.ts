/**
 * TS-02 模範解答
 *
 * ポイント
 * - nextId はファクトリの呼び出しごとに作られるローカル変数。返した関数がそれを「閉じ込める」＝クロージャ
 * - email の有無で条件付きスプレッド `...(email !== undefined && { email })` を使うとキーごと省ける
 * - updateUser はスプレッドで新しいオブジェクトを作る（React の state 更新と同じ考え方）
 */

export interface User {
  readonly id: number;
  name: string;
  email?: string;
}

export type UserPatch = Partial<Omit<User, "id">>;

export function createUserFactory(): (name: string, email?: string) => User {
  let nextId = 1;
  return (name, email) => ({
    id: nextId++,
    name,
    ...(email !== undefined && { email }),
  });
}

export function updateUser(user: User, patch: UserPatch): User {
  return { ...user, ...patch };
}

export function displayName(user: User): string {
  return user.email ? `${user.name} <${user.email}>` : user.name;
}
