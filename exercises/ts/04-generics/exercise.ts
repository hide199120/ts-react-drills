/**
 * TS-04 ★ ジェネリクスの基礎
 *
 * 【課題】 any を使わず、呼び出し側で型が正しく推論されるように書く。
 * 1. first(arr)        先頭要素を返す。空なら undefined。戻り値は T | undefined
 * 2. pluck(items, key) 各要素から key の値だけを取り出した配列を返す
 *                      pluck(users, "age") の戻り値は number[] になること
 *                      存在しないキーを渡したらコンパイルエラーになること
 * 3. createStack<T>()  push / pop / peek / size / isEmpty を持つスタックを返す
 *                      pop / peek は空のとき undefined
 * 4. mergeDefaults(defaults, overrides)
 *                      overrides で上書きしたオブジェクトを返す。
 *                      overrides は defaults に存在するキーだけ指定でき（Partial）、
 *                      戻り値の型は defaults と同じ T
 *
 * 【ルール】 any / as 禁止。型引数は推論に任せ、呼び出し側で <...> を書かなくて済むように。
 *
 * 【面接で聞かれること】
 * - ジェネリクスを使うメリットは？ any や unknown との違いは？
 * - `K extends keyof T` の extends は何を意味する？（制約）
 * - T[K] は何型？（インデックスアクセス型）
 */

export function first(arr: any): any {
  throw new Error("TODO");
}

export function pluck(items: any, key: any): any {
  throw new Error("TODO");
}

export interface Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  size(): number;
  isEmpty(): boolean;
}

export function createStack(): any {
  throw new Error("TODO");
}

export function mergeDefaults(defaults: any, overrides: any): any {
  throw new Error("TODO");
}
