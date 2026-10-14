/**
 * TS-06 模範解答
 *
 * ポイント
 * - 型は「元になる型から導出」すると、元が変わったときに追従する（単一の情報源）
 * - typeof fetchTodo は「値（関数）から型を取り出す」型レベルの typeof
 * - Parameters<F>[1] のように、タプル型にインデックスアクセスして N 番目の引数を取れる
 * - Exclude は「ユニオンから取り除く」、Omit は「オブジェクトのキーを取り除く」。混同しやすい
 */

export interface Todo {
  id: number;
  title: string;
  description?: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  createdAt: Date;
  assignee: string | null;
}

export async function fetchTodo(id: number, options?: { signal?: AbortSignal }): Promise<Todo> {
  throw new Error("not implemented (型だけ使う)");
}

export type TodoListItem = Pick<Todo, "id" | "title" | "done">;
export type TodoInput = Omit<Todo, "id" | "createdAt">;
export type TodoPatch = Partial<Omit<Todo, "id">>;
export type CompleteTodo = Required<Todo>;
export type FrozenTodo = Readonly<Todo>;
export type TodoMap = Record<number, Todo>;
export type PriorityLabels = Record<Todo["priority"], string>;
export type FetchTodoResult = Awaited<ReturnType<typeof fetchTodo>>;
export type FetchTodoOptions = Parameters<typeof fetchTodo>[1];
export type Assignee = NonNullable<Todo["assignee"]>;
export type NormalPriority = Exclude<Todo["priority"], "high">;
