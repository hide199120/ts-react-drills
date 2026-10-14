import { expectTypeOf } from "vitest";
import type { CartAction, Product } from "./exercise";

describe("R-07 types", () => {
  test("CartAction は判別可能なユニオン", () => {
    const p = {} as Product;
    const ok: CartAction[] = [
      { type: "add", product: p },
      { type: "remove", productId: "a" },
      { type: "setQuantity", productId: "a", quantity: 1 },
      { type: "clear" },
    ];
    expectTypeOf(ok).not.toBeAny();

    // @ts-expect-error 存在しない type
    const a: CartAction = { type: "unknown" };
    // @ts-expect-error add には product が必要
    const b: CartAction = { type: "add" };
    // @ts-expect-error setQuantity には quantity が必要
    const c: CartAction = { type: "setQuantity", productId: "a" };
    void [a, b, c];
  });
});
