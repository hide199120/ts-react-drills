import { groupBy, totalPaidByCustomer, topCustomers, uniqueBy, type Order } from "./exercise";

const orders: Order[] = [
  { id: 1, customer: "Sato", amount: 3000, status: "paid" },
  { id: 2, customer: "Suzuki", amount: 5000, status: "paid" },
  { id: 3, customer: "Sato", amount: 2000, status: "paid" },
  { id: 4, customer: "Tanaka", amount: 9000, status: "cancelled" },
  { id: 5, customer: "Tanaka", amount: 1000, status: "paid" },
  { id: 6, customer: "Ito", amount: 5000, status: "paid" },
  { id: 7, customer: "Suzuki", amount: 4000, status: "pending" },
];

describe("TS-03 array methods", () => {
  test("groupBy", () => {
    expect(groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? "even" : "odd"))).toEqual({ odd: [1, 3], even: [2, 4] });
    expect(groupBy([], () => "x")).toEqual({});
    const byStatus = groupBy(orders, (o) => o.status);
    expect(byStatus.paid?.map((o) => o.id)).toEqual([1, 2, 3, 5, 6]);
    expect(byStatus.cancelled?.map((o) => o.id)).toEqual([4]);
  });

  test("totalPaidByCustomer: paid のみ集計", () => {
    expect(totalPaidByCustomer(orders)).toEqual({ Sato: 5000, Suzuki: 5000, Tanaka: 1000, Ito: 5000 });
  });

  test("topCustomers: 金額降順・同額は名前昇順", () => {
    expect(topCustomers(orders, 3)).toEqual(["Ito", "Sato", "Suzuki"]);
    expect(topCustomers(orders, 10)).toEqual(["Ito", "Sato", "Suzuki", "Tanaka"]);
  });

  test("引数の配列を破壊しない", () => {
    const copy = structuredClone(orders);
    topCustomers(orders, 2);
    totalPaidByCustomer(orders);
    expect(orders).toEqual(copy);
  });

  test("uniqueBy: 最初に出たものを残し順序を保つ", () => {
    expect(uniqueBy(orders, (o) => o.customer).map((o) => o.id)).toEqual([1, 2, 4, 6]);
    expect(uniqueBy([3, 1, 3, 2, 1], (n) => n)).toEqual([3, 1, 2]);
  });
});
