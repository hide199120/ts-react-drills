/**
 * R-06 ★★ カスタムフック
 *
 * 【課題】 3つのフックを作る（renderHook でテストする）。
 *
 * 1. useToggle(initial = false)
 *    戻り値: [value, toggle, setValue]
 *    - toggle() で反転。toggle の参照は再レンダーしても変わらないこと（useCallback）
 *
 * 2. useDebouncedValue(value, delay)
 *    value が変わってから delay ミリ秒、変化が無かったときに初めて新しい値を返す。
 *    （初回は value をそのまま返す）
 *
 * 3. useLocalStorage<T>(key, initialValue)
 *    useState と同じ使い勝手で、値を localStorage に JSON で保存するフック。
 *    戻り値: [value, setValue]
 *    - 初回は localStorage に key があればその値（JSON.parse）、なければ initialValue
 *    - JSON.parse に失敗したら initialValue
 *    - setValue は値でも関数（prev => next）でも受け付ける（useState と同じ）
 *    - 値を更新したら localStorage にも保存する
 *
 * 【面接で聞かれること】
 * - カスタムフックと普通の関数の違い。なぜ use で始める必要がある？
 * - フックのルール（トップレベルでのみ呼ぶ、条件分岐の中で呼ばない）とその理由
 * - 2つのコンポーネントで同じカスタムフックを使うと state は共有される？（されない）
 * - useState(() => ...) の遅延初期化とは？ いつ使う？
 */

export function useToggle(initial = false): [boolean, () => void, (value: boolean) => void] {
  throw new Error("TODO");
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  throw new Error("TODO");
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  throw new Error("TODO");
}
