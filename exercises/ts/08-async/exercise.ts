/**
 * TS-08 ★★ 非同期処理（Promise / async-await / エラーハンドリング）
 *
 * 【課題】
 * 1. sleep(ms)
 *    ms ミリ秒後に resolve する Promise<void> を返す。
 *
 * 2. withTimeout(promise, ms)
 *    promise が ms 以内に終われば結果を返し、終わらなければ Error("timeout") で reject する。
 *
 * 3. retry(fn, retries)
 *    fn を実行し、失敗したら最大 retries 回まで再実行する。
 *    （retries = 2 なら最大3回実行）。すべて失敗したら最後のエラーで reject。
 *
 * 4. fetchAllInParallel(ids, fetcher)
 *    ids すべてについて fetcher を「並列」に呼び、ids と同じ順序で結果を返す。
 *    1つでも失敗したら全体を reject。
 *
 * 5. fetchAllSettled(ids, fetcher)
 *    並列に呼び、成功したものと失敗したものを分けて返す。
 *    { ok: 成功した値の配列（ids 順）, failedIds: 失敗した id の配列（ids 順） }
 *
 * 6. runSequentially(tasks)
 *    () => Promise<T> の配列を「1つずつ順番に」実行し、結果の配列を返す。
 *
 * 【面接で聞かれること】
 * - Promise.all / allSettled / race / any の違い
 * - forEach の中で await しても待ってくれないのはなぜ？
 * - async 関数の中で throw すると呼び出し側にはどう伝わる？
 * - 直列と並列、それぞれどんなときに使う？（API 負荷、依存関係）
 * - イベントループ、マイクロタスクとマクロタスクの違い（setTimeout と Promise.then の順序）
 */

export function sleep(ms: number): Promise<void> {
  throw new Error("TODO");
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  throw new Error("TODO");
}

export async function retry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  throw new Error("TODO");
}

export async function fetchAllInParallel<T>(ids: number[], fetcher: (id: number) => Promise<T>): Promise<T[]> {
  throw new Error("TODO");
}

export async function fetchAllSettled<T>(
  ids: number[],
  fetcher: (id: number) => Promise<T>,
): Promise<{ ok: T[]; failedIds: number[] }> {
  throw new Error("TODO");
}

export async function runSequentially<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  throw new Error("TODO");
}
