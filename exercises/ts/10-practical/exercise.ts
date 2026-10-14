/**
 * TS-10 ★★★ 実践: よく出る実装問題を型安全に書く
 *
 * 【課題】
 * 1. debounce(fn, ms)
 *    最後の呼び出しから ms 経過したときに、最後の引数で fn を1回だけ呼ぶ関数を返す。
 *    返す関数は fn と同じ引数の型を持ち、cancel() で保留中の呼び出しを取り消せる。
 *
 * 2. throttle(fn, ms)
 *    最初の呼び出しは即座に実行し、その後 ms の間の呼び出しは無視する。
 *
 * 3. memoize(fn)
 *    引数1つの関数の結果をキャッシュする。同じ引数なら fn を再実行しない。
 *
 * 4. createEmitter<Events>()
 *    型安全なイベントエミッター。
 *      type Events = { login: { userId: number }; logout: undefined };
 *      const e = createEmitter<Events>();
 *      const off = e.on("login", (payload) => payload.userId); // payload の型が推論される
 *      e.emit("login", { userId: 1 });
 *      off(); // 登録解除
 *    - 存在しないイベント名、合わない payload はコンパイルエラーになること
 *    - on は登録解除関数を返す
 *
 * 【面接で聞かれること】
 * - debounce と throttle の違いと、それぞれのユースケース（検索入力 / スクロール）
 * - メモ化の注意点（キャッシュが増え続ける、オブジェクト引数の比較）
 * - Parameters<F> を使うと何が嬉しい？
 */

export function debounce(fn: any, ms: number): any {
  throw new Error("TODO");
}

export function throttle(fn: any, ms: number): any {
  throw new Error("TODO");
}

export function memoize(fn: any): any {
  throw new Error("TODO");
}

export function createEmitter(): any {
  throw new Error("TODO");
}
