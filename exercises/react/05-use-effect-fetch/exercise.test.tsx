import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProfile, type User } from "./exercise";

/** 呼び出しごとに resolve / reject を外から操作できる fetchUser を作る */
function controllableFetcher() {
  const calls: {
    id: number;
    signal: AbortSignal;
    resolve: (u: User) => void;
    reject: (e: unknown) => void;
  }[] = [];
  const fetchUser = vi.fn(
    (id: number, signal: AbortSignal) =>
      new Promise<User>((resolve, reject) => {
        calls.push({ id, signal, resolve, reject });
        // 本物の fetch と同じく、abort されたら AbortError で reject する
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  );
  return { fetchUser, calls };
}

const user = (id: number): User => ({ id, name: `User ${id}`, email: `user${id}@example.com` });

describe("R-05 UserProfile", () => {
  test("読み込み中 → 成功表示", async () => {
    const { fetchUser, calls } = controllableFetcher();
    render(<UserProfile userId={1} fetchUser={fetchUser} />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    expect(fetchUser).toHaveBeenCalledWith(1, expect.any(AbortSignal));

    await act(async () => calls[0]!.resolve(user(1)));
    expect(screen.getByRole("heading", { name: "User 1" })).toBeInTheDocument();
    expect(screen.getByText("user1@example.com")).toBeInTheDocument();
    expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
  });

  test("失敗時はエラー表示、再試行で再取得", async () => {
    const { fetchUser, calls } = controllableFetcher();
    render(<UserProfile userId={1} fetchUser={fetchUser} />);
    await act(async () => calls[0]!.reject(new Error("サーバーエラー")));
    expect(screen.getByRole("alert")).toHaveTextContent("エラー: サーバーエラー");

    await userEvent.click(screen.getByRole("button", { name: "再試行" }));
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(calls).toHaveLength(2);

    await act(async () => calls[1]!.resolve(user(1)));
    expect(screen.getByRole("heading", { name: "User 1" })).toBeInTheDocument();
  });

  test("userId が変わると再取得する", async () => {
    const { fetchUser, calls } = controllableFetcher();
    const { rerender } = render(<UserProfile userId={1} fetchUser={fetchUser} />);
    await act(async () => calls[0]!.resolve(user(1)));

    rerender(<UserProfile userId={2} fetchUser={fetchUser} />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
    expect(fetchUser).toHaveBeenLastCalledWith(2, expect.any(AbortSignal));
    await act(async () => calls.at(-1)!.resolve(user(2)));
    expect(screen.getByRole("heading", { name: "User 2" })).toBeInTheDocument();
  });

  test("競合状態: 古いリクエストを abort し、遅れて届いた古い結果で上書きしない", async () => {
    const { fetchUser, calls } = controllableFetcher();
    const { rerender } = render(<UserProfile userId={1} fetchUser={fetchUser} />);
    rerender(<UserProfile userId={2} fetchUser={fetchUser} />);

    const first = calls.find((c) => c.id === 1)!;
    const second = calls.find((c) => c.id === 2)!;
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);

    await act(async () => second.resolve(user(2)));
    await act(async () => first.resolve(user(1))); // 遅れて古い結果が届く
    expect(screen.getByRole("heading", { name: "User 2" })).toBeInTheDocument();
    expect(screen.queryByText("User 1")).not.toBeInTheDocument();
  });

  test("abort による失敗はエラー表示しない", async () => {
    const { fetchUser, calls } = controllableFetcher();
    const { rerender } = render(<UserProfile userId={1} fetchUser={fetchUser} />);
    await act(async () => rerender(<UserProfile userId={2} fetchUser={fetchUser} />));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await act(async () => calls.at(-1)!.resolve(user(2)));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("アンマウント時に abort する", () => {
    const { fetchUser, calls } = controllableFetcher();
    const { unmount } = render(<UserProfile userId={1} fetchUser={fetchUser} />);
    unmount();
    expect(calls[0]!.signal.aborted).toBe(true);
  });
});
