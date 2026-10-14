import { isUser, parseUsers, getErrorMessage, pick } from "./exercise";

describe("TS-07 type guards", () => {
  test("isUser", () => {
    expect(isUser({ id: 1, name: "a", tags: [] })).toBe(true);
    expect(isUser({ id: 1, name: "a", tags: ["x", "y"], extra: true })).toBe(true);
    expect(isUser({ id: "1", name: "a", tags: [] })).toBe(false);
    expect(isUser({ id: 1, tags: [] })).toBe(false);
    expect(isUser({ id: 1, name: "a", tags: [1] })).toBe(false);
    expect(isUser({ id: 1, name: "a", tags: "x" })).toBe(false);
    expect(isUser(null)).toBe(false);
    expect(isUser(undefined)).toBe(false);
    expect(isUser("user")).toBe(false);
    expect(isUser([])).toBe(false);
  });

  test("parseUsers", () => {
    expect(parseUsers("{broken")).toEqual([]);
    expect(parseUsers('{"id":1}')).toEqual([]);
    expect(
      parseUsers(JSON.stringify([{ id: 1, name: "a", tags: [] }, { id: 2 }, null, { id: 3, name: "c", tags: ["t"] }])),
    ).toEqual([
      { id: 1, name: "a", tags: [] },
      { id: 3, name: "c", tags: ["t"] },
    ]);
  });

  test("getErrorMessage", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
    expect(getErrorMessage(new TypeError("type"))).toBe("type");
    expect(getErrorMessage("oops")).toBe("oops");
    expect(getErrorMessage({ message: "from object" })).toBe("from object");
    expect(getErrorMessage({ message: 123 })).toBe("不明なエラー");
    expect(getErrorMessage(null)).toBe("不明なエラー");
    expect(getErrorMessage(42)).toBe("不明なエラー");
  });

  test("pick", () => {
    const user = { id: 1, name: "a", tags: [], age: 20 };
    expect(pick(user, "id", "name")).toEqual({ id: 1, name: "a" });
  });
});
