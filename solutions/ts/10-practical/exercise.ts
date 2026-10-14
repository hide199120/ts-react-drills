/**
 * TS-10 模範解答
 *
 * ポイント
 * - debounce: 呼ばれるたびに前のタイマーを clearTimeout して張り直す
 * - throttle: 「待機中フラグ」を立て、ms 後に下ろす
 * - memoize: Map の has でチェックする（`cache.get(x) ?? ...` だと結果が undefined のとき毎回再計算してしまう）
 * - emitter: Events のキーを K extends keyof Events で受け、payload を Events[K] にする。
 *   ハンドラは Map<イベント名, Set<関数>> で管理すると登録解除が簡単
 */

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

export function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let waiting = false;
  return (...args: A) => {
    if (waiting) return;
    fn(...args);
    waiting = true;
    setTimeout(() => {
      waiting = false;
    }, ms);
  };
}

export function memoize<Arg, R>(fn: (arg: Arg) => R): (arg: Arg) => R {
  const cache = new Map<Arg, R>();
  return (arg) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

export function createEmitter<Events extends Record<string, unknown>>() {
  const handlers = new Map<keyof Events, Set<(payload: never) => void>>();

  return {
    on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): () => void {
      const set = handlers.get(event) ?? new Set();
      handlers.set(event, set);
      set.add(handler);
      return () => {
        set.delete(handler);
      };
    },
    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
      handlers.get(event)?.forEach((h) => (h as (p: Events[K]) => void)(payload));
    },
  };
}
