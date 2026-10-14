/**
 * TS-03 模範解答
 *
 * ポイント
 * - reduce の初期値に型を付ける（`{} as Record<K, T[]>`）。付けないと {} 型になり代入でエラー
 * - 集計は「filter で絞る → reduce で畳む」と段階を分けると読みやすい
 * - sort は破壊的。Object.entries の結果（新しい配列）に対して sort するか、toSorted を使う
 * - 比較関数: 降順は b - a、文字列は localeCompare
 */

export type OrderStatus = "paid" | "pending" | "cancelled";

export interface Order {
  id: number;
  customer: string;
  amount: number;
  status: OrderStatus;
}

export function groupBy<T, K extends PropertyKey>(items: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyFn(item);
      (acc[key] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}

export function totalPaidByCustomer(orders: readonly Order[]): Record<string, number> {
  return orders
    .filter((o) => o.status === "paid")
    .reduce<Record<string, number>>((acc, o) => {
      acc[o.customer] = (acc[o.customer] ?? 0) + o.amount;
      return acc;
    }, {});
}

export function topCustomers(orders: readonly Order[], n: number): string[] {
  return Object.entries(totalPaidByCustomer(orders))
    .toSorted(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB))
    .slice(0, n)
    .map(([name]) => name);
}

export function uniqueBy<T>(items: readonly T[], keyFn: (item: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
