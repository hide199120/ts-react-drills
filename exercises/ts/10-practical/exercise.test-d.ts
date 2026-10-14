import { expectTypeOf } from "vitest";
import { debounce, memoize, createEmitter } from "./exercise";

describe("TS-10 types", () => {
  test("debounce は元の関数の引数型を保つ", () => {
    const d = debounce((a: string, b: number) => {}, 100);
    expectTypeOf(d).parameters.toEqualTypeOf<[string, number]>();
    expectTypeOf(d.cancel).toEqualTypeOf<() => void>();
    // @ts-expect-error 引数の型が違う
    d(1, 2);
  });

  test("memoize は元の関数と同じ型", () => {
    const m = memoize((n: number) => String(n));
    expectTypeOf(m).toEqualTypeOf<(arg: number) => string>();
  });

  test("createEmitter は型安全", () => {
    type Events = { login: { userId: number }; logout: undefined };
    const e = createEmitter<Events>();
    e.on("login", (payload) => {
      expectTypeOf(payload).toEqualTypeOf<{ userId: number }>();
    });
    expectTypeOf(e.on("logout", () => {})).toEqualTypeOf<() => void>();
    // @ts-expect-error 存在しないイベント
    e.on("signup", () => {});
    // @ts-expect-error payload の型が違う
    e.emit("login", { userId: "1" });
  });
});
