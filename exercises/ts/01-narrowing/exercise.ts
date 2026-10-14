/**
 * TS-01 ★ 型注釈とユニオン型の絞り込み（narrowing）
 *
 * 【課題】
 * 1. formatId(id)
 *    - number のとき: 4桁ゼロ埋めして先頭に "#" を付ける（42 → "#0042"）
 *    - string のとき: 前後の空白を除いて大文字にする（" ab-1 " → "AB-1"）
 *
 * 2. describeValue(value)
 *    - null / undefined → "なし"
 *    - 配列 → ", " で連結（["a", "b"] → "a, b"）。空配列は "なし"
 *    - 文字列 → そのまま
 *
 * 3. sumNumbers(values)
 *    - number はそのまま、string は数値に変換して合計する
 *    - 数値に変換できない文字列（"abc" など）は無視する
 *
 * 【ルール】 any 禁止。引数・戻り値の型注釈を自分で書くこと。
 *
 * 【面接で聞かれること】
 * - typeof / Array.isArray / in / instanceof による絞り込みの違いは？
 * - `==` と `===` の違い。`value == null` は何にマッチする？
 */

export function formatId(id: string | number): string {
  throw new Error("TODO");
}

export function describeValue(value: string | string[] | null | undefined): string {
  throw new Error("TODO");
}

export function sumNumbers(values: (number | string)[]): number {
  throw new Error("TODO");
}
