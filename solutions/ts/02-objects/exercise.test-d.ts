import { expectTypeOf } from "vitest";
import { updateUser, type UserPatch, type User } from "./exercise";

describe("TS-02 types", () => {
  test("UserPatch は id を除いた全項目が任意", () => {
    expectTypeOf<UserPatch>().toEqualTypeOf<{ name?: string; email?: string }>();
  });

  test("updateUser で id は変更できない", () => {
    const u: User = { id: 1, name: "a" };
    // @ts-expect-error id は patch に含められない
    updateUser(u, { id: 2 });
  });

  test("User.id は readonly", () => {
    const u: User = { id: 1, name: "a" };
    // @ts-expect-error readonly なので代入できない
    u.id = 2;
  });
});
