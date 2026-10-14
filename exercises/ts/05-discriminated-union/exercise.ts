/**
 * TS-05 ★ 判別可能なユニオン型（discriminated union）と網羅性チェック
 *
 * 【課題】
 * 1. area(shape)
 *    図形の面積を返す。circle: π r²、rect: 幅×高さ、triangle: 底辺×高さ÷2
 *    switch 文の default で assertNever を呼び、図形の種類を追加し忘れたら
 *    コンパイルエラーになるようにすること。
 *
 * 2. assertNever(value)
 *    引数の型は never。呼ばれたら Error を投げる。
 *
 * 3. renderState(state)
 *    API の状態を表示文字列にする。
 *    idle → "待機中" / loading → "読み込み中..." /
 *    success → "N件"（data の件数）/ error → "エラー: メッセージ"
 *
 * 4. FetchState<T> 型を定義する（下の TODO）
 *    status が "success" のときだけ data: T を、"error" のときだけ error: string を持つ。
 *    { status: "loading"; data: T } のような不正な状態を型で表現できないようにする。
 *
 * 【面接で聞かれること】
 * - `{ loading: boolean; data?: T; error?: string }` という型の何が問題？
 *   （loading も error も data も同時に存在しうる＝ありえない状態を表現できてしまう）
 * - never 型とは？ 網羅性チェックはなぜ可能なのか？
 */

export type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

export function assertNever(value: never): never {
  throw new Error("TODO");
}

export function area(shape: Shape): number {
  throw new Error("TODO");
}

// TODO: 4つの状態 idle / loading / success / error を持つユニオン型にする
export type FetchState<T> = unknown;

export function renderState(state: FetchState<string[]>): string {
  throw new Error("TODO");
}
