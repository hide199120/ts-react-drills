import { expectTypeOf } from "vitest";
import type * as T from "./exercise";

interface Todo {
  title: string;
  done: boolean;
  meta: { author: { name: string }; likes: number };
}

describe("TS-09 type-level", () => {
  test("1. MyPick", () => {
    expectTypeOf<T.MyPick<Todo, "title" | "done">>().toEqualTypeOf<{ title: string; done: boolean }>();
    // @ts-expect-error 存在しないキーはエラー
    type _Invalid = T.MyPick<Todo, "invalid">;
  });

  test("2. MyReadonly", () => {
    expectTypeOf<T.MyReadonly<{ a: string; b?: number }>>().toEqualTypeOf<{ readonly a: string; readonly b?: number }>();
  });

  test("3. MyPartial", () => {
    expectTypeOf<T.MyPartial<{ a: string; b: number }>>().toEqualTypeOf<{ a?: string; b?: number }>();
  });

  test("4. ValueOf", () => {
    expectTypeOf<T.ValueOf<{ a: 1; b: "x"; c: boolean }>>().toEqualTypeOf<1 | "x" | boolean>();
  });

  test("5. MyReturnType", () => {
    expectTypeOf<T.MyReturnType<() => string>>().toEqualTypeOf<string>();
    expectTypeOf<T.MyReturnType<(a: number, b: string) => Promise<boolean>>>().toEqualTypeOf<Promise<boolean>>();
  });

  test("6. UnwrapPromise", () => {
    expectTypeOf<T.UnwrapPromise<Promise<number>>>().toEqualTypeOf<number>();
    expectTypeOf<T.UnwrapPromise<string>>().toEqualTypeOf<string>();
  });

  test("7. ElementOf", () => {
    expectTypeOf<T.ElementOf<string[]>>().toEqualTypeOf<string>();
    expectTypeOf<T.ElementOf<(number | boolean)[]>>().toEqualTypeOf<number | boolean>();
    expectTypeOf<T.ElementOf<readonly ["a", "b"]>>().toEqualTypeOf<"a" | "b">();
    expectTypeOf<T.ElementOf<string>>().toEqualTypeOf<never>();
  });

  test("8. DeepReadonly", () => {
    expectTypeOf<T.DeepReadonly<Todo>>().toEqualTypeOf<{
      readonly title: string;
      readonly done: boolean;
      readonly meta: { readonly author: { readonly name: string }; readonly likes: number };
    }>();
  });

  test("9. Getters", () => {
    expectTypeOf<T.Getters<{ name: string; age: number }>>().toEqualTypeOf<{
      getName: () => string;
      getAge: () => number;
    }>();
  });

  test("10. KeysOfType", () => {
    expectTypeOf<T.KeysOfType<{ a: string; b: number; c: string }, string>>().toEqualTypeOf<"a" | "c">();
    expectTypeOf<T.KeysOfType<Todo, boolean>>().toEqualTypeOf<"done">();
  });
});
