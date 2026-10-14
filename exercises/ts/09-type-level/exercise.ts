/**
 * TS-09 ★★★ 型レベルプログラミング（keyof / Mapped Types / Conditional Types / infer）
 *
 * 【課題】 組み込みユーティリティ型を自作する。
 * Pick / Readonly / Partial / ReturnType / Awaited などの組み込み型は使用禁止（自力で書く）。
 *
 * 【面接で聞かれること】
 * - Mapped Type `{ [K in keyof T]: ... }` の仕組み
 * - Conditional Type の分配（distributive）とは？ `T extends U ? X : Y` に union を渡すと？
 * - infer は何をしている？
 * - 型レベルの処理を実務でどの程度書くべきか？（ライブラリ作者以外は読めれば十分、という意見も）
 */

// 1. MyPick<T, K>: T から K のキーだけ取り出す。K は T のキーに制約すること
export type MyPick<T, K> = unknown;

// 2. MyReadonly<T>: すべてのプロパティを readonly に
export type MyReadonly<T> = unknown;

// 3. MyPartial<T>: すべてのプロパティを任意に
export type MyPartial<T> = unknown;

// 4. ValueOf<T>: オブジェクトの値の型のユニオン  ValueOf<{a: 1, b: "x"}> = 1 | "x"
export type ValueOf<T> = unknown;

// 5. MyReturnType<F>: 関数の戻り値の型（infer を使う）
export type MyReturnType<F> = unknown;

// 6. UnwrapPromise<T>: Promise<X> なら X、そうでなければ T のまま（ネストは1段でOK）
export type UnwrapPromise<T> = unknown;

// 7. ElementOf<T>: 配列の要素の型。配列でなければ never
export type ElementOf<T> = unknown;

// 8. DeepReadonly<T>: ネストしたオブジェクトも含めて全部 readonly に（配列・関数は考えなくてOK）
export type DeepReadonly<T> = unknown;

// 9. Getters<T>: { name: string } → { getName: () => string }
//    ヒント: Key Remapping（as）と Capitalize、テンプレートリテラル型
export type Getters<T> = unknown;

// 10. KeysOfType<T, V>: 値の型が V であるキーだけのユニオン
//     KeysOfType<{a: string; b: number; c: string}, string> = "a" | "c"
export type KeysOfType<T, V> = unknown;
