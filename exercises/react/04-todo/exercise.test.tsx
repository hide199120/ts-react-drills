import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoApp, type Todo } from "./exercise";

const initialTodos: Todo[] = [
  { id: "1", title: "牛乳を買う", done: false },
  { id: "2", title: "本を返す", done: true },
  { id: "3", title: "メール返信", done: false },
];

const input = () => screen.getByLabelText("新しいタスク");
const titles = () => screen.queryAllByRole("listitem").map((li) => li.querySelector("label")?.textContent?.trim());

describe("R-04 TodoApp", () => {
  test("initialTodos を表示し、残り件数を出す", () => {
    render(<TodoApp initialTodos={initialTodos} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("checkbox", { name: "本を返す" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "牛乳を買う" })).not.toBeChecked();
    expect(screen.getByText("残り 2 件")).toBeInTheDocument();
  });

  test("追加: ボタンでも Enter でも追加でき、入力欄が空になる", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.type(input(), "  掃除  ");
    await user.click(screen.getByRole("button", { name: "追加" }));
    await user.type(input(), "洗濯{Enter}");
    expect(screen.getByRole("checkbox", { name: "掃除" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "洗濯" })).toBeInTheDocument();
    expect(input()).toHaveValue("");
    expect(screen.getByText("残り 2 件")).toBeInTheDocument();
  });

  test("追加: 空白だけなら追加しない", async () => {
    const user = userEvent.setup();
    render(<TodoApp />);
    await user.type(input(), "   {Enter}");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  test("チェックで完了を切り替え、残り件数が変わる", async () => {
    const user = userEvent.setup();
    render(<TodoApp initialTodos={initialTodos} />);
    await user.click(screen.getByRole("checkbox", { name: "牛乳を買う" }));
    expect(screen.getByRole("checkbox", { name: "牛乳を買う" })).toBeChecked();
    expect(screen.getByText("残り 1 件")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "本を返す" }));
    expect(screen.getByText("残り 2 件")).toBeInTheDocument();
  });

  test("削除", async () => {
    const user = userEvent.setup();
    render(<TodoApp initialTodos={initialTodos} />);
    await user.click(screen.getByRole("button", { name: "本を返すを削除" }));
    expect(screen.queryByRole("checkbox", { name: "本を返す" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  test("フィルタ", async () => {
    const user = userEvent.setup();
    render(<TodoApp initialTodos={initialTodos} />);
    expect(screen.getByRole("button", { name: "すべて" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "未完了" }));
    expect(titles()).toEqual(["牛乳を買う", "メール返信"]);
    expect(screen.getByRole("button", { name: "未完了" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "すべて" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "完了" }));
    expect(titles()).toEqual(["本を返す"]);

    // 完了フィルタ中に未完了へ戻すとリストから消える
    await user.click(screen.getByRole("checkbox", { name: "本を返す" }));
    expect(titles()).toEqual([]);
    expect(screen.getByText("残り 3 件")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "すべて" }));
    expect(titles()).toHaveLength(3);
  });

  test("initialTodos の配列を書き換えない", async () => {
    const user = userEvent.setup();
    const todos = structuredClone(initialTodos);
    render(<TodoApp initialTodos={todos} />);
    await user.click(screen.getByRole("checkbox", { name: "牛乳を買う" }));
    await user.click(screen.getByRole("button", { name: "メール返信を削除" }));
    await user.type(input(), "追加分{Enter}");
    expect(todos).toEqual(initialTodos);
  });
});
