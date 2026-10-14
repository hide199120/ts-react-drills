import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectableList, sortItems, type Item } from "./exercise";

const items: Item[] = [
  { id: "c", name: "Cherry", price: 300 },
  { id: "a", name: "Apple", price: 200 },
  { id: "b", name: "Banana", price: 100 },
];

function setup() {
  const onRowRender = vi.fn();
  const sort = vi.fn(sortItems);
  const user = userEvent.setup();
  render(<SelectableList items={items} sort={sort} onRowRender={onRowRender} />);
  const renderCount = (id: string) => onRowRender.mock.calls.filter(([x]) => x === id).length;
  const rowNames = () => within(screen.getByRole("list")).getAllByRole("button").map((b) => b.textContent);
  return { user, onRowRender, sort, renderCount, rowNames };
}

describe("R-09 memo", () => {
  test("動作: 名前順で表示、並べ替え、選択", async () => {
    const { user, rowNames } = setup();
    expect(rowNames()).toEqual(["Apple（¥200）", "Banana（¥100）", "Cherry（¥300）"]);
    await user.click(screen.getByRole("button", { name: "価格順" }));
    expect(rowNames()).toEqual(["Banana（¥100）", "Apple（¥200）", "Cherry（¥300）"]);
    await user.click(screen.getByRole("button", { name: "Cherry（¥300）" }));
    expect(screen.getByText("選択中: Cherry")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cherry（¥300）" })).toHaveAttribute("aria-pressed", "true");
  });

  test("メモ入力では ItemRow が再レンダーされない", async () => {
    const { user, onRowRender } = setup();
    expect(onRowRender).toHaveBeenCalledTimes(3);
    await user.type(screen.getByLabelText("メモ"), "hello");
    expect(screen.getByLabelText("メモ")).toHaveValue("hello");
    expect(onRowRender).toHaveBeenCalledTimes(3);
  });

  test("選択時は変化した行だけ再レンダー", async () => {
    const { user, renderCount } = setup();
    await user.click(screen.getByRole("button", { name: "Apple（¥200）" }));
    expect(renderCount("a")).toBe(2); // 選択された
    expect(renderCount("b")).toBe(1);
    expect(renderCount("c")).toBe(1);

    await user.click(screen.getByRole("button", { name: "Banana（¥100）" }));
    expect(renderCount("a")).toBe(3); // 選択が外れた
    expect(renderCount("b")).toBe(2); // 選択された
    expect(renderCount("c")).toBe(1); // 無関係
  });

  test("sort は並び順が変わったときだけ呼ばれる", async () => {
    const { user, sort } = setup();
    expect(sort).toHaveBeenCalledTimes(1);
    await user.type(screen.getByLabelText("メモ"), "abc");
    await user.click(screen.getByRole("button", { name: "Apple（¥200）" }));
    expect(sort).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "価格順" }));
    expect(sort).toHaveBeenCalledTimes(2);
  });
});
