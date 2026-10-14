import { area, assertNever, renderState } from "./exercise";

describe("TS-05 discriminated union", () => {
  test("area", () => {
    expect(area({ kind: "circle", radius: 2 })).toBeCloseTo(Math.PI * 4);
    expect(area({ kind: "rect", width: 3, height: 4 })).toBe(12);
    expect(area({ kind: "triangle", base: 6, height: 5 })).toBe(15);
  });

  test("assertNever は例外を投げる", () => {
    expect(() => assertNever("x" as never)).toThrow();
  });

  test("renderState", () => {
    expect(renderState({ status: "idle" })).toBe("待機中");
    expect(renderState({ status: "loading" })).toBe("読み込み中...");
    expect(renderState({ status: "success", data: ["a", "b", "c"] })).toBe("3件");
    expect(renderState({ status: "error", error: "通信に失敗しました" })).toBe("エラー: 通信に失敗しました");
  });
});
