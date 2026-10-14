import { first, pluck, createStack, mergeDefaults } from "./exercise";

const users = [
  { name: "Taro", age: 30 },
  { name: "Hanako", age: 25 },
];

describe("TS-04 generics", () => {
  test("first", () => {
    expect(first([10, 20])).toBe(10);
    expect(first([])).toBeUndefined();
  });

  test("pluck", () => {
    expect(pluck(users, "age")).toEqual([30, 25]);
    expect(pluck(users, "name")).toEqual(["Taro", "Hanako"]);
  });

  test("createStack", () => {
    const s = createStack();
    expect(s.isEmpty()).toBe(true);
    expect(s.pop()).toBeUndefined();
    s.push(1);
    s.push(2);
    expect(s.size()).toBe(2);
    expect(s.peek()).toBe(2);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
    expect(s.isEmpty()).toBe(true);
  });

  test("スタックはインスタンスごとに独立", () => {
    const a = createStack();
    const b = createStack();
    a.push("x");
    expect(b.size()).toBe(0);
  });

  test("mergeDefaults", () => {
    const defaults = { theme: "light", pageSize: 20, showHelp: true };
    expect(mergeDefaults(defaults, { pageSize: 50 })).toEqual({ theme: "light", pageSize: 50, showHelp: true });
    expect(defaults.pageSize).toBe(20);
  });
});
