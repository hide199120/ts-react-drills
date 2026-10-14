/**
 * R-06 模範解答
 *
 * ポイント
 * - useToggle: setValue(v => !v) と関数型アップデートにすれば toggle は value に依存しない
 *   → useCallback の依存配列を [] にでき、参照が安定する
 * - useDebouncedValue: value が変わるたびにタイマーを張り直し、クリーンアップで前のタイマーを消す。
 *   「effect のクリーンアップ = 前回分の後始末」の典型例
 * - useLocalStorage: useState に関数を渡す遅延初期化で、localStorage の読み込みを初回だけにする。
 *   保存は useEffect で value の変化に追従させると、関数型アップデートもそのまま使える
 *   （SSR では localStorage が無いので typeof window チェックが必要になる点も知っておくと良い）
 */
import { useCallback, useEffect, useState } from "react";

export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return initialValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
