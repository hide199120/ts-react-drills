import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cart, cartReducer, selectTotalCount, selectTotalPrice, type CartState, type Product } from "./exercise";

const apple: Product = { id: "apple", name: "りんご", price: 150 };
const melon: Product = { id: "melon", name: "メロン", price: 1200 };

describe("R-07 cartReducer", () => {
  const empty: CartState = { items: [] };

  test("add: 新規は quantity 1、既存は +1", () => {
    let s = cartReducer(empty, { type: "add", product: apple });
    expect(s.items).toEqual([{ ...apple, quantity: 1 }]);
    s = cartReducer(s, { type: "add", product: melon });
    s = cartReducer(s, { type: "add", product: apple });
    expect(s.items).toEqual([
      { ...apple, quantity: 2 },
      { ...melon, quantity: 1 },
    ]);
  });

  test("remove", () => {
    const s: CartState = { items: [{ ...apple, quantity: 2 }, { ...melon, quantity: 1 }] };
    expect(cartReducer(s, { type: "remove", productId: "apple" }).items).toEqual([{ ...melon, quantity: 1 }]);
  });

  test("setQuantity: 0 以下なら消す", () => {
    const s: CartState = { items: [{ ...apple, quantity: 2 }] };
    expect(cartReducer(s, { type: "setQuantity", productId: "apple", quantity: 5 }).items[0]?.quantity).toBe(5);
    expect(cartReducer(s, { type: "setQuantity", productId: "apple", quantity: 0 }).items).toEqual([]);
    expect(cartReducer(s, { type: "setQuantity", productId: "apple", quantity: -1 }).items).toEqual([]);
  });

  test("clear", () => {
    const s: CartState = { items: [{ ...apple, quantity: 2 }] };
    expect(cartReducer(s, { type: "clear" })).toEqual({ items: [] });
  });

  test("元の state を変更しない", () => {
    const s: CartState = { items: [{ ...apple, quantity: 1 }] };
    const snapshot = structuredClone(s);
    const next = cartReducer(s, { type: "add", product: apple });
    cartReducer(s, { type: "setQuantity", productId: "apple", quantity: 9 });
    expect(s).toEqual(snapshot);
    expect(next).not.toBe(s);
    expect(next.items[0]).not.toBe(s.items[0]);
  });

  test("selectors", () => {
    const s: CartState = { items: [{ ...apple, quantity: 3 }, { ...melon, quantity: 2 }] };
    expect(selectTotalPrice(s)).toBe(150 * 3 + 1200 * 2);
    expect(selectTotalCount(s)).toBe(5);
    expect(selectTotalPrice(empty)).toBe(0);
  });
});

describe("R-07 Cart", () => {
  test("追加・減らす・合計表示・空にする", async () => {
    const user = userEvent.setup();
    render(<Cart products={[apple, melon]} />);
    expect(screen.getByText("合計: ¥0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "りんごをカートに追加" }));
    await user.click(screen.getByRole("button", { name: "りんごをカートに追加" }));
    await user.click(screen.getByRole("button", { name: "メロンをカートに追加" }));

    const items = within(screen.getByRole("list", { name: "カート" })).getAllByRole("listitem");
    expect(within(items[0]!).getByText("りんご × 2")).toBeInTheDocument();
    expect(within(items[1]!).getByText("メロン × 1")).toBeInTheDocument();
    expect(screen.getByText("合計: ¥1,500")).toBeInTheDocument();
    expect(screen.getByText("3点")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "メロンを減らす" }));
    expect(screen.queryByText(/メロン ×/)).not.toBeInTheDocument();
    expect(screen.getByText("合計: ¥300")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "カートを空にする" }));
    expect(within(screen.getByRole("list", { name: "カート" })).queryAllByRole("listitem")).toHaveLength(0);
    expect(screen.getByText("0点")).toBeInTheDocument();
  });
});
