import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => cleanup());

// Testing Library は jest のフェイクタイマーしか検知しないため、vitest 用の橋渡しをする
// （これが無いと vi.useFakeTimers() 中の userEvent / waitFor が止まる）
(globalThis as unknown as { jest: unknown }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
};
