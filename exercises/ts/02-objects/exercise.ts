/**
 * TS-02 ★ オブジェクト型・オプショナル・readonly・クロージャ
 *
 * 【課題】
 * 1. createUserFactory()
 *    呼ぶたびに id を 1, 2, 3... と自動採番する createUser 関数を返す。
 *    - createUser(name, email?) は User を返す
 *    - email を渡さなかった場合、返すオブジェクトに email プロパティ自体を含めない
 *      （{ email: undefined } ではなく、キーが存在しない状態）
 *    - ファクトリを2回呼んだら、それぞれ独立して 1 から採番する
 *
 * 2. updateUser(user, patch)
 *    patch の内容で上書きした「新しい」User を返す。元の user は変更しないこと。
 *    patch で id は変更できない（型で禁止する。UserPatch 型を定義せよ）
 *
 * 3. displayName(user)
 *    email があれば "名前 <email>"、なければ "名前"
 *
 * 【ルール】 UserPatch は Partial / Omit を使って User から導出すること（手書き禁止）
 *
 * 【面接で聞かれること】
 * - interface と type の違い。どう使い分ける？
 * - readonly は実行時にも効く？（効かない。Object.freeze との違い）
 * - スプレッド構文はシャローコピー。ネストしたオブジェクトはどうなる？
 * - クロージャとは何か。createUserFactory の採番がファクトリごとに独立する理由は？
 */

export interface User {
  readonly id: number;
  name: string;
  email?: string;
}

// TODO: User から id を除き、残りを全て任意にした型
export type UserPatch = unknown;

export function createUserFactory(): (name: string, email?: string) => User {
  throw new Error("TODO");
}

export function updateUser(user: User, patch: UserPatch): User {
  throw new Error("TODO");
}

export function displayName(user: User): string {
  throw new Error("TODO");
}
