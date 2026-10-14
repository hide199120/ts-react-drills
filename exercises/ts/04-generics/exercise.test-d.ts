import { expectTypeOf } from "vitest";
import { first, pluck, createStack, mergeDefaults, type Stack } from "./exercise";

const users = [
  { name: "Taro", age: 30 },
  { name: "Hanako", age: 25 },
];

describe("TS-04 types", () => {
  test("first の戻り値は T | undefined", () => {
    expectTypeOf(first([1, 2, 3])).toEqualTypeOf<number | undefined>();
    expectTypeOf(first(["a"])).toEqualTypeOf<string | undefined>();
  });

  test("pluck の戻り値は T[K][]", () => {
    expectTypeOf(pluck(users, "age")).toEqualTypeOf<number[]>();
    expectTypeOf(pluck(users, "name")).toEqualTypeOf<string[]>();
    // @ts-expect-error 存在しないキー
    pluck(users, "email");
  });

  test("createStack<T>() は Stack<T>", () => {
    const s = createStack<number>();
    expectTypeOf(s).toEqualTypeOf<Stack<number>>();
    // @ts-expect-error number のスタックに string は積めない
    s.push("x");
  });

  test("mergeDefaults の型", () => {
    const d = { theme: "light", pageSize: 20 };
    expectTypeOf(mergeDefaults(d, { pageSize: 50 })).toEqualTypeOf<{ theme: string; pageSize: number }>();
    // @ts-expect-error defaults にないキー
    mergeDefaults(d, { unknownKey: 1 });
    // @ts-expect-error 型が違う
    mergeDefaults(d, { pageSize: "50" });
  });
});
