import { expectTypeOf } from "vitest";
import { isUser, pick, type User } from "./exercise";

describe("TS-07 types", () => {
  test("isUser は型ガードとして働く", () => {
    const value: unknown = JSON.parse("{}");
    if (isUser(value)) {
      expectTypeOf(value).toEqualTypeOf<User>();
    }
  });

  test("pick の戻り値は Pick<T, K>", () => {
    const user = { id: 1, name: "a", age: 20 };
    expectTypeOf(pick(user, "id", "name")).toEqualTypeOf<Pick<typeof user, "id" | "name">>();
    // @ts-expect-error 存在しないキー
    pick(user, "email");
  });
});
