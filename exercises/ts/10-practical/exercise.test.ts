import { debounce, throttle, memoize, createEmitter } from "./exercise";

describe("TS-10 practical", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("debounce: 最後の呼び出しから ms 後に最後の引数で1回だけ呼ぶ", () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d("a");
    vi.advanceTimersByTime(200);
    d("b");
    vi.advanceTimersByTime(200);
    d("c");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  test("debounce: cancel", () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d("a");
    d.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });

  test("throttle: 最初は即実行、ms の間は無視", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t(1);
    t(2);
    t(3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(1);
    vi.advanceTimersByTime(100);
    t(4);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(4);
  });

  test("memoize: 同じ引数なら再計算しない", () => {
    const slowSquare = vi.fn((n: number) => n * n);
    const fast = memoize(slowSquare);
    expect(fast(4)).toBe(16);
    expect(fast(4)).toBe(16);
    expect(fast(5)).toBe(25);
    expect(slowSquare).toHaveBeenCalledTimes(2);
  });

  test("memoize: 結果が undefined でもキャッシュする", () => {
    const fn = vi.fn((_: string) => undefined);
    const m = memoize(fn);
    m("x");
    m("x");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("createEmitter: on / emit / off", () => {
    type Events = { login: { userId: number }; logout: undefined };
    const e = createEmitter<Events>();
    const h1 = vi.fn();
    const h2 = vi.fn();
    const off = e.on("login", h1);
    e.on("login", h2);
    e.emit("login", { userId: 1 });
    expect(h1).toHaveBeenCalledWith({ userId: 1 });
    expect(h2).toHaveBeenCalledWith({ userId: 1 });

    off();
    e.emit("login", { userId: 2 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(2);
  });

  test("createEmitter: 他のイベントのハンドラは呼ばない", () => {
    type Events = { login: { userId: number }; logout: undefined };
    const e = createEmitter<Events>();
    const h = vi.fn();
    e.on("logout", h);
    e.emit("login", { userId: 1 });
    expect(h).not.toHaveBeenCalled();
    e.emit("logout", undefined);
    expect(h).toHaveBeenCalledTimes(1);
  });
});
