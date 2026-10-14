import { sleep, withTimeout, retry, fetchAllInParallel, fetchAllSettled, runSequentially } from "./exercise";

/** 同時実行数を記録する fetcher を作る */
function trackingFetcher(failIds: number[] = []) {
  let active = 0;
  const stats = { maxActive: 0, calls: [] as number[] };
  const fetcher = async (id: number) => {
    stats.calls.push(id);
    active++;
    stats.maxActive = Math.max(stats.maxActive, active);
    await new Promise((r) => setTimeout(r, 30 - id * 5)); // id が大きいほど早く終わる
    active--;
    if (failIds.includes(id)) throw new Error(`fail ${id}`);
    return `user${id}`;
  };
  return { fetcher, stats };
}

describe("TS-08 async", () => {
  test("sleep", async () => {
    const start = Date.now();
    await sleep(50);
    expect(Date.now() - start).toBeGreaterThanOrEqual(45);
  });

  test("withTimeout: 間に合えば値を返す", async () => {
    await expect(withTimeout(sleep(10).then(() => "done"), 100)).resolves.toBe("done");
  });

  test("withTimeout: 間に合わなければ timeout", async () => {
    await expect(withTimeout(sleep(100).then(() => "done"), 10)).rejects.toThrow("timeout");
  });

  test("withTimeout: 元の Promise の reject はそのまま伝える", async () => {
    await expect(withTimeout(Promise.reject(new Error("original")), 100)).rejects.toThrow("original");
  });

  test("retry: 途中で成功すればその値", async () => {
    let count = 0;
    const fn = vi.fn(async () => {
      count++;
      if (count < 3) throw new Error(`fail ${count}`);
      return "ok";
    });
    await expect(retry(fn, 2)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("retry: 全部失敗したら最後のエラー", async () => {
    let count = 0;
    const fn = vi.fn(async () => {
      count++;
      throw new Error(`fail ${count}`);
    });
    await expect(retry(fn, 2)).rejects.toThrow("fail 3");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test("fetchAllInParallel: 並列に実行し、順序を保つ", async () => {
    const { fetcher, stats } = trackingFetcher();
    await expect(fetchAllInParallel([1, 2, 3], fetcher)).resolves.toEqual(["user1", "user2", "user3"]);
    expect(stats.maxActive).toBe(3);
  });

  test("fetchAllInParallel: 1つでも失敗したら reject", async () => {
    const { fetcher } = trackingFetcher([2]);
    await expect(fetchAllInParallel([1, 2, 3], fetcher)).rejects.toThrow("fail 2");
  });

  test("fetchAllSettled", async () => {
    const { fetcher, stats } = trackingFetcher([2, 4]);
    await expect(fetchAllSettled([1, 2, 3, 4], fetcher)).resolves.toEqual({
      ok: ["user1", "user3"],
      failedIds: [2, 4],
    });
    expect(stats.maxActive).toBe(4);
  });

  test("runSequentially: 1つずつ順番に実行", async () => {
    const { fetcher, stats } = trackingFetcher();
    const result = await runSequentially([3, 1, 2].map((id) => () => fetcher(id)));
    expect(result).toEqual(["user3", "user1", "user2"]);
    expect(stats.maxActive).toBe(1);
    expect(stats.calls).toEqual([3, 1, 2]);
  });
});
