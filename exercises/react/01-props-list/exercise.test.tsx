import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserList, type User } from "./exercise";

const users: User[] = [
  { id: 1, name: "佐藤", role: "admin" },
  { id: 2, name: "鈴木", role: "member" },
  { id: 3, name: "高橋", role: "member" },
];

describe("R-01 UserList", () => {
  test("ユーザーを li で表示し、見出しに人数を出す", () => {
    render(<UserList users={users} />);
    expect(screen.getByRole("heading", { name: "ユーザー一覧（3人）" })).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("佐藤");
    expect(items[2]).toHaveTextContent("高橋");
  });

  test("admin にだけ「管理者」を表示", () => {
    render(<UserList users={users} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]!).getByText("管理者")).toBeInTheDocument();
    expect(within(items[1]!).queryByText("管理者")).not.toBeInTheDocument();
    expect(screen.getAllByText("管理者")).toHaveLength(1);
  });

  test("空のときはメッセージを出し、リストは出さない", () => {
    render(<UserList users={[]} />);
    expect(screen.getByText("ユーザーがいません")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ユーザー一覧（0人）" })).toBeInTheDocument();
  });

  test("クリックで onSelect にユーザーを渡す", async () => {
    const onSelect = vi.fn();
    render(<UserList users={users} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "鈴木" }));
    expect(onSelect).toHaveBeenCalledWith(users[1]);
  });

  test("onSelect が無くてもクリックでエラーにならない", async () => {
    render(<UserList users={users} />);
    await userEvent.click(screen.getByRole("button", { name: "佐藤" }));
  });

  test("key の警告が出ない", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<UserList users={users} />);
    const keyWarning = spy.mock.calls.flat().some((arg) => typeof arg === "string" && arg.includes('"key"'));
    expect(keyWarning).toBe(false);
    spy.mockRestore();
  });
});
