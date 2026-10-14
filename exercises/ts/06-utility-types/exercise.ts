/**
 * TS-06 ★★ 組み込みユーティリティ型
 *
 * 【課題】 下の Todo / API 関数から、TODO の型を「導出」する。
 * Todo の定義を手でコピーして書き直すのは禁止。Todo が変わったら自動で追従する書き方にすること。
 *
 * 使うもの: Pick / Omit / Partial / Required / Readonly / Record / ReturnType / Parameters / Awaited / NonNullable / Extract / Exclude
 *
 * 【面接で聞かれること】
 * - Pick と Omit の使い分け。Omit の欠点は？（存在しないキーを指定してもエラーにならない）
 * - typeof は型の世界と値の世界で意味が違う。それぞれ何？
 * - API レスポンスの型と、フォーム入力の型を別に定義するのはなぜ？
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

// 1. 一覧表示用: id と title と done だけ
export type TodoListItem = unknown;

// 2. 新規作成フォームの入力: id と createdAt はサーバー側で付けるので除く
export type TodoInput = unknown;

// 3. 更新用: id 以外のすべてを任意に
export type TodoPatch = unknown;

// 4. description も含めて全項目を必須にした Todo
export type CompleteTodo = unknown;

// 5. 変更不可の Todo
export type FrozenTodo = unknown;

// 6. id をキー、Todo を値に持つ辞書
export type TodoMap = unknown;

// 7. priority のそれぞれに表示ラベル（string）を対応させるオブジェクトの型
//    { low: string; medium: string; high: string }
export type PriorityLabels = unknown;

// 8. fetchTodo が最終的に返す値の型（Promise を外した型）。Todo と直接書かずに typeof fetchTodo から導出
export type FetchTodoResult = unknown;

// 9. fetchTodo の第2引数の型（typeof fetchTodo から導出）
export type FetchTodoOptions = unknown;

// 10. assignee から null を除いた型
export type Assignee = unknown;

// 11. priority のうち "high" 以外
export type NormalPriority = unknown;
