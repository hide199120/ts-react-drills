import { act, renderHook } from "@testing-library/react";
import { useToggle, useDebouncedValue, useLocalStorage } from "./exercise";

describe("R-06 useToggle", () => {
  test("toggle / setValue", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
    act(() => result.current[2](true));
    expect(result.current[0]).toBe(true);
  });

  test("toggle の参照は変わらない", () => {
    const { result } = renderHook(() => useToggle(true));
    const firstToggle = result.current[1];
    act(() => result.current[1]());
    expect(result.current[1]).toBe(firstToggle);
  });

  test("同じレンダー内で2回 toggle すると元に戻る", () => {
    const { result } = renderHook(() => useToggle());
    act(() => {
      result.current[1]();
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);
  });
});

describe("R-06 useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("delay 経過するまで古い値を返す", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "a" },
    });
    expect(result.current).toBe("a");

    rerender({ value: "ab" });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: "abc" });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("a"); // まだ変化から300ms経っていない

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("abc");
  });
});

describe("R-06 useLocalStorage", () => {
  beforeEach(() => localStorage.clear());

  test("保存値がなければ initialValue", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));
    expect(result.current[0]).toBe(0);
  });

  test("保存値があればそれを使う", () => {
    localStorage.setItem("settings", JSON.stringify({ theme: "dark" }));
    const { result } = renderHook(() => useLocalStorage("settings", { theme: "light" }));
    expect(result.current[0]).toEqual({ theme: "dark" });
  });

  test("壊れた JSON なら initialValue", () => {
    localStorage.setItem("broken", "{not json");
    const { result } = renderHook(() => useLocalStorage("broken", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  test("setValue で state と localStorage を更新（関数も可）", () => {
    const { result } = renderHook(() => useLocalStorage("count", 0));
    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(localStorage.getItem("count")).toBe("5");

    act(() => {
      result.current[1]((prev) => prev + 1);
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(7);
    expect(localStorage.getItem("count")).toBe("7");
  });

  test("再マウントしても値が残る", () => {
    const first = renderHook(() => useLocalStorage("name", ""));
    act(() => first.result.current[1]("Taro"));
    first.unmount();
    const second = renderHook(() => useLocalStorage("name", ""));
    expect(second.result.current[0]).toBe("Taro");
  });
});
