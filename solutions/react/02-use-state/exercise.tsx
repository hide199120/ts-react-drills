/**
 * R-02 模範解答
 *
 * ポイント
 * - state はレンダーごとの「スナップショット」。ハンドラ内の count は、そのレンダー時点の値で固定されている
 *   → setCount(count + step) を3回呼んでも、3回とも同じ count を元に計算するので +step にしかならない
 * - 前の state を元に更新するときは関数型アップデート setCount(c => ...) を使う。
 *   更新関数はキューに積まれ、前の結果を受け取って順番に実行される
 *
 *     // 関数型アップデートで3回呼ぶ例（これでも正しく動く）
 *     setCount(c => clamp(c + step));
 *     setCount(c => clamp(c + step));
 *     setCount(c => clamp(c + step));
 *
 * - ただし onChange に「新しい値」を渡したいので、この解答では次の値をハンドラ内で計算してから set している。
 *   onChange を updater 関数の中で呼ぶのは NG（updater は純粋であるべきで、StrictMode では2回呼ばれる）
 * - useEffect で count を監視して onChange を呼ぶと、初回にも呼ばれる・余計なレンダーが走るなどの問題がある
 */
import { useState } from "react";

interface CounterProps {
  initial?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}

export function Counter({ initial = 0, min = -Infinity, max = Infinity, step = 1, onChange }: CounterProps) {
  const [count, setCount] = useState(initial);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const update = (next: number) => {
    const value = clamp(next);
    if (value === count) return;
    setCount(value);
    onChange?.(value);
  };

  return (
    <div>
      <p data-testid="count">{count}</p>
      <button type="button" onClick={() => update(count - step)} disabled={count <= min}>
        -
      </button>
      <button type="button" onClick={() => update(count + step)} disabled={count >= max}>
        +
      </button>
      <button type="button" onClick={() => update(count + step * 3)}>
        +3
      </button>
      <button type="button" onClick={() => update(initial)}>
        リセット
      </button>
    </div>
  );
}
