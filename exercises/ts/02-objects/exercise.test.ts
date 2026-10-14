import { createUserFactory, updateUser, displayName, type User } from "./exercise";

describe("TS-02 objects", () => {
  test("createUser: id を自動採番する", () => {
    const createUser = createUserFactory();
    expect(createUser("Taro").id).toBe(1);
    expect(createUser("Hanako").id).toBe(2);
    expect(createUser("Jiro").id).toBe(3);
  });

  test("createUser: ファクトリごとに独立して採番する", () => {
    const a = createUserFactory();
    const b = createUserFactory();
    a("x");
    a("y");
    expect(b("z").id).toBe(1);
  });

  test("createUser: email 未指定ならキー自体を持たない", () => {
    const createUser = createUserFactory();
    const u = createUser("Taro");
    expect(u).toEqual({ id: 1, name: "Taro" });
    expect("email" in u).toBe(false);
    expect(createUser("Hanako", "h@example.com")).toEqual({ id: 2, name: "Hanako", email: "h@example.com" });
  });

  test("updateUser: 元のオブジェクトを変更しない", () => {
    const original: User = { id: 1, name: "Taro" };
    const updated = updateUser(original, { name: "Taro Yamada", email: "t@example.com" });
    expect(updated).toEqual({ id: 1, name: "Taro Yamada", email: "t@example.com" });
    expect(original).toEqual({ id: 1, name: "Taro" });
    expect(updated).not.toBe(original);
  });

  test("displayName", () => {
    expect(displayName({ id: 1, name: "Taro" })).toBe("Taro");
    expect(displayName({ id: 1, name: "Taro", email: "t@example.com" })).toBe("Taro <t@example.com>");
  });
});
