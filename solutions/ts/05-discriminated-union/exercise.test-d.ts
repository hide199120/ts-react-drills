import { expectTypeOf } from "vitest";
import type { FetchState } from "./exercise";

describe("TS-05 types", () => {
  test("正しい状態は代入できる", () => {
    const states: FetchState<number>[] = [
      { status: "idle" },
      { status: "loading" },
      { status: "success", data: 1 },
      { status: "error", error: "x" },
    ];
    expectTypeOf(states).not.toBeAny();
  });

  test("ありえない状態は代入できない", () => {
    // @ts-expect-error loading 中に data は持てない
    const a: FetchState<number> = { status: "loading", data: 1 };
    // @ts-expect-error success には data が必須
    const b: FetchState<number> = { status: "success" };
    // @ts-expect-error 存在しない status
    const c: FetchState<number> = { status: "done" };
    // @ts-expect-error data の型が違う
    const d: FetchState<number> = { status: "success", data: "1" };
    void [a, b, c, d];
  });

  test("status で絞り込むと data にアクセスできる", () => {
    const s = {} as FetchState<string>;
    if (typeof s === "object" && s !== null && "status" in s && s.status === "success") {
      expectTypeOf(s.data).toEqualTypeOf<string>();
    }
  });
});
