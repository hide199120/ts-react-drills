import { formatId, describeValue, sumNumbers } from "./exercise";

describe("TS-01 narrowing", () => {
  test("formatId: number は4桁ゼロ埋め", () => {
    expect(formatId(42)).toBe("#0042");
    expect(formatId(7)).toBe("#0007");
    expect(formatId(12345)).toBe("#12345");
  });

  test("formatId: string は trim して大文字", () => {
    expect(formatId(" ab-1 ")).toBe("AB-1");
  });

  test("describeValue", () => {
    expect(describeValue(null)).toBe("なし");
    expect(describeValue(undefined)).toBe("なし");
    expect(describeValue([])).toBe("なし");
    expect(describeValue(["a", "b", "c"])).toBe("a, b, c");
    expect(describeValue("hello")).toBe("hello");
  });

  test("sumNumbers", () => {
    expect(sumNumbers([1, 2, 3])).toBe(6);
    expect(sumNumbers([1, "2", "3.5"])).toBe(6.5);
    expect(sumNumbers(["abc", 10, "", "x1"])).toBe(10);
    expect(sumNumbers([])).toBe(0);
  });
});
