/**
 * TS-08 模範解答
 *
 * ポイント
 * - withTimeout は Promise.race。タイマーは finally で clearTimeout して後片付けする
 * - retry は for ループ + try/catch + await が一番素直
 * - 並列: ids.map(fetcher) で全部いっぺんに開始 → Promise.all で待つ。結果は ids の順序で返る
 * - 直列: for...of の中で await。forEach(async ...) は待たない（forEach は戻り値の Promise を無視する）
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function retry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(); // ← await を付けないと catch で拾えない
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

export async function fetchAllInParallel<T>(ids: number[], fetcher: (id: number) => Promise<T>): Promise<T[]> {
  return Promise.all(ids.map((id) => fetcher(id)));
}

export async function fetchAllSettled<T>(
  ids: number[],
  fetcher: (id: number) => Promise<T>,
): Promise<{ ok: T[]; failedIds: number[] }> {
  const results = await Promise.allSettled(ids.map((id) => fetcher(id)));
  const ok: T[] = [];
  const failedIds: number[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") ok.push(r.value);
    else failedIds.push(ids[i]!);
  });
  return { ok, failedIds };
}

export async function runSequentially<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}
