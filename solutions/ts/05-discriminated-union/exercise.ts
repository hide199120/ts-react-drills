/**
 * TS-05 模範解答
 *
 * ポイント
 * - 共通のリテラル型プロパティ（kind / status）で switch すると、各 case で型が絞り込まれる
 * - 全ケースを処理すると default に来る値は never 型になる。
 *   新しい kind を追加して case を書き忘れると、never でない値を assertNever に渡すことになりコンパイルエラー
 * - 「状態ごとに持つデータが違う」ものはユニオンで表すと、ありえない組み合わせを型で排除できる
 */

export type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

export function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rect":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape);
  }
}

export type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

export function renderState(state: FetchState<string[]>): string {
  switch (state.status) {
    case "idle":
      return "待機中";
    case "loading":
      return "読み込み中...";
    case "success":
      return `${state.data.length}件`;
    case "error":
      return `エラー: ${state.error}`;
    default:
      return assertNever(state);
  }
}
