/**
 * TS-09 模範解答
 *
 * ポイント
 * - Mapped Type: `[P in K]: T[P]` で K の各キーをループする。修飾子 readonly / ? を付け外しできる
 * - Conditional Type + infer: 「この形にマッチしたら、その部分を変数として取り出す」パターンマッチ
 * - `readonly (infer E)[]` にすると readonly 配列・タプルにもマッチする（string[] は readonly string[] に代入可能）
 * - Key Remapping: `[K in keyof T as 新しいキー]`。as の結果が never になったキーは消える
 */

export type MyPick<T, K extends keyof T> = { [P in K]: T[P] };

export type MyReadonly<T> = { readonly [K in keyof T]: T[K] };

export type MyPartial<T> = { [K in keyof T]?: T[K] };

export type ValueOf<T> = T[keyof T];

export type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type ElementOf<T> = T extends readonly (infer E)[] ? E : never;

export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export type Getters<T> = {
  [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K];
};

export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];
