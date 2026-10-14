/**
 * TS-04 模範解答
 *
 * ポイント
 * - 型引数 T を引数から推論させる。呼び出し側は first([1,2]) と書くだけで T = number になる
 * - `K extends keyof T` で「T のキーのどれか」に制約。T[K] で値の型を取り出せる
 * - スタックは配列をクロージャに閉じ込めて外から直接触れないようにする（カプセル化）
 * - NoInfer<...>（TS 5.4+）で overrides 側から T を推論させない。defaults だけが型の基準になる
 */

export function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}

export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

export interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size(): number;
  isEmpty(): boolean;
}

export function createStack<T>(): Stack<T> {
  const items: T[] = [];
  return {
    push: (item) => {
      items.push(item);
    },
    pop: () => items.pop(),
    peek: () => items.at(-1),
    size: () => items.length,
    isEmpty: () => items.length === 0,
  };
}

export function mergeDefaults<T extends object>(defaults: T, overrides: NoInfer<Partial<T>>): T {
  return { ...defaults, ...overrides };
}
