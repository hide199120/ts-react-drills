import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserSearch, type SearchUser } from "./exercise";

function controllableSearch() {
  const calls: {
    query: string;
    signal: AbortSignal;
    resolve: (u: SearchUser[]) => void;
    reject: (e: unknown) => void;
  }[] = [];
  const searchUsers = vi.fn(
    (query: string, signal: AbortSignal) =>
      new Promise<SearchUser[]>((resolve, reject) => {
        calls.push({ query, signal, resolve, reject });
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
  );
  return { searchUsers, calls };
}

const results: SearchUser[] = [
  { id: 1, name: "田中 太郎", department: "開発部" },
  { id: 2, name: "田中 花子", department: "営業部" },
];

describe("R-10 UserSearch", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));
  afterEach(() => vi.useRealTimers());

  function setup() {
    const api = controllableSearch();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<UserSearch searchUsers={api.searchUsers} />);
    const input = () => screen.getByLabelText("検索");
    const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));
    return { ...api, user, input, wait };
  }

  test("入力が止まって 300ms 後に trim した文字列で検索", async () => {
    const { user, input, wait, searchUsers } = setup();
    await user.type(input(), " 田中 ");
    await wait(299);
    expect(searchUsers).not.toHaveBeenCalled();
    await wait(1);
    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(searchUsers).toHaveBeenCalledWith("田中", expect.any(AbortSignal));
  });

  test("検索中 → 結果表示", async () => {
    const { user, input, wait, calls } = setup();
    await user.type(input(), "田中");
    await wait(300);
    expect(screen.getByText("検索中...")).toBeInTheDocument();
    await act(async () => calls[0]!.resolve(results));
    expect(screen.queryByText("検索中...")).not.toBeInTheDocument();
    expect(screen.getByText("2件")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["田中 太郎（開発部）", "田中 花子（営業部）"]);
  });

  test("0件のとき", async () => {
    const { user, input, wait, calls } = setup();
    await user.type(input(), "zzz");
    await wait(300);
    await act(async () => calls[0]!.resolve([]));
    expect(screen.getByText("該当するユーザーはいません")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  test("失敗のとき", async () => {
    const { user, input, wait, calls } = setup();
    await user.type(input(), "田中");
    await wait(300);
    await act(async () => calls[0]!.reject(new Error("500")));
    expect(screen.getByRole("alert")).toHaveTextContent("検索に失敗しました");
  });

  test("空白だけなら検索しない", async () => {
    const { user, input, wait, searchUsers } = setup();
    await user.type(input(), "   ");
    await wait(1000);
    expect(searchUsers).not.toHaveBeenCalled();
    expect(screen.queryByText("検索中...")).not.toBeInTheDocument();
  });

  test("新しい検索で前の検索を abort し、古い結果を表示しない", async () => {
    const { user, input, wait, calls } = setup();
    await user.type(input(), "田");
    await wait(300);
    await user.type(input(), "中");
    await wait(300);
    expect(calls.map((c) => c.query)).toEqual(["田", "田中"]);
    expect(calls[0]!.signal.aborted).toBe(true);

    await act(async () => calls[1]!.resolve([results[0]!]));
    await act(async () => calls[0]!.resolve(results));
    expect(screen.getByText("1件")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("クリアで入力と結果を消し、保留中の検索も走らない", async () => {
    const { user, input, wait, calls, searchUsers } = setup();
    const clear = () => screen.getByRole("button", { name: "クリア" });
    expect(clear()).toBeDisabled();

    await user.type(input(), "田中");
    await wait(300);
    await act(async () => calls[0]!.resolve(results));
    expect(screen.getByText("2件")).toBeInTheDocument();

    await user.type(input(), "太"); // debounce 待ちの状態でクリア
    await user.click(clear());
    expect(input()).toHaveValue("");
    expect(screen.queryByText("2件")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);

    await wait(1000);
    expect(searchUsers).toHaveBeenCalledTimes(1);
    expect(clear()).toBeDisabled();
  });
});
