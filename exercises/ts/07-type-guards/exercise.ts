/**
 * TS-07 ★★ unknown と型ガード（外部データを安全に扱う）
 *
 * 【課題】
 * 1. isUser(value): value is User
 *    value が User の形をしているか実行時にチェックする型ガード。
 *    id は number、name は string、tags は string の配列であること。
 *
 * 2. parseUsers(json)
 *    JSON 文字列をパースし、配列なら User として正しい要素だけを返す。
 *    - JSON として壊れている → []
 *    - 配列でない → []
 *    - 配列中の不正な要素は捨てる
 *
 * 3. getErrorMessage(error)
 *    catch した値（unknown）からメッセージを取り出す。
 *    - Error インスタンス → error.message
 *    - 文字列 → そのまま
 *    - message プロパティ（string）を持つオブジェクト → その message
 *    - それ以外 → "不明なエラー"
 *
 * 4. pick<T>(obj, ...keys)  ※おまけ
 *    指定したキーだけを持つ新しいオブジェクトを返す。戻り値は Pick<T, K>
 *
 * 【ルール】 as による型アサーション禁止（pick の空オブジェクト初期化だけは可）。any 禁止。
 *
 * 【面接で聞かれること】
 * - any と unknown の違い。外部入力（API・JSON.parse・catch）に unknown を使う理由は？
 * - `value is User` を返す関数の中身が間違っていたらどうなる？（TS は信じるので実行時に壊れる）
 * - 実務ではこれを zod などのスキーマバリデーションで行う。メリットは？
 */

export interface User {
  id: number;
  name: string;
  tags: string[];
}

export function isUser(value: unknown): boolean {
  throw new Error("TODO");
}

export function parseUsers(json: string): User[] {
  throw new Error("TODO");
}

export function getErrorMessage(error: unknown): string {
  throw new Error("TODO");
}

export function pick(obj: any, ...keys: any[]): any {
  throw new Error("TODO");
}
