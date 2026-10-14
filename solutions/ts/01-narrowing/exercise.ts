/**
 * TS-01 模範解答
 *
 * ポイント
 * - typeof で primitive を、Array.isArray で配列を絞り込む
 * - `value == null` は null と undefined の両方にマッチする（ここだけは == を使う慣習がある）
 * - Number("abc") は NaN。NaN 判定は Number.isNaN を使う（NaN === NaN は false）
 */

export function formatId(id: string | number): string {
  if (typeof id === "number") {
    return `#${String(id).padStart(4, "0")}`;
  }
  return id.trim().toUpperCase();
}

export function describeValue(value: string | string[] | null | undefined): string {
  if (value == null) return "なし";
  if (Array.isArray(value)) {
    return value.length === 0 ? "なし" : value.join(", ");
  }
  return value;
}

export function sumNumbers(values: (number | string)[]): number {
  return values.reduce<number>((sum, v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? sum : sum + n;
  }, 0);
}
