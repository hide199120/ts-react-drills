/**
 * TS-03 ★ 配列メソッド（map / filter / reduce / sort）
 *
 * 【課題】 注文データを集計する関数を書く。
 * 1. groupBy(items, keyFn)
 *    keyFn の戻り値ごとに要素をまとめたオブジェクトを返す。
 *    groupBy([1,2,3,4], n => n % 2 === 0 ? "even" : "odd") → { odd: [1,3], even: [2,4] }
 *
 * 2. totalPaidByCustomer(orders)
 *    status が "paid" の注文だけを対象に、顧客ごとの合計金額を返す。
 *
 * 3. topCustomers(orders, n)
 *    paid の合計金額が多い順に顧客名を n 件返す。同額なら名前の昇順。
 *
 * 4. uniqueBy(items, keyFn)
 *    keyFn の値が重複する要素を除く（最初に出たものを残す）。順序は保つ。
 *
 * 【ルール】
 * - Object.groupBy / Map.groupBy は使わない（reduce で書くこと）
 * - for 文禁止。配列メソッドだけで書く
 * - 引数の配列を破壊しないこと（sort は破壊的メソッド！）
 *
 * 【面接で聞かれること】
 * - map と forEach の違い。filter → map と reduce 1回、どちらを選ぶ？
 * - sort が破壊的なのはなぜ問題？ toSorted との違いは？
 * - 配列の重複除去に Set を使うときの注意点（オブジェクトは参照比較）
 */

export type OrderStatus = "paid" | "pending" | "cancelled";

export interface Order {
  id: number;
  customer: string;
  amount: number;
  status: OrderStatus;
}

export function groupBy<T, K extends PropertyKey>(items: readonly T[], keyFn: (item: T) => K): Record<K, T[]> {
  throw new Error("TODO");
}

export function totalPaidByCustomer(orders: readonly Order[]): Record<string, number> {
  throw new Error("TODO");
}

export function topCustomers(orders: readonly Order[], n: number): string[] {
  throw new Error("TODO");
}

export function uniqueBy<T>(items: readonly T[], keyFn: (item: T) => unknown): T[] {
  throw new Error("TODO");
}
