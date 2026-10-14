import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Counter } from "./exercise";

const count = () => screen.getByTestId("count");
const btn = (name: string) => screen.getByRole("button", { name });

describe("R-02 Counter", () => {
  test("初期値（省略時 0）を表示", () => {
    render(<Counter />);
    expect(count()).toHaveTextContent("0");
  });

  test("+ / - で step ずつ増減", async () => {
    const user = userEvent.setup();
    render(<Counter initial={10} step={5} />);
    await user.click(btn("+"));
    expect(count()).toHaveTextContent("15");
    await user.click(btn("-"));
    await user.click(btn("-"));
    expect(count()).toHaveTextContent("5");
  });

  test("min / max で止まり、ボタンが disabled になる", async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} min={0} max={3} step={2} />);
    expect(btn("-")).toBeDisabled();
    await user.click(btn("+"));
    await user.click(btn("+"));
    expect(count()).toHaveTextContent("3");
    expect(btn("+")).toBeDisabled();
    expect(btn("-")).toBeEnabled();
  });

  test("+3 は + を3回押したのと同じ", async () => {
    const user = userEvent.setup();
    render(<Counter initial={1} step={2} />);
    await user.click(btn("+3"));
    expect(count()).toHaveTextContent("7");
  });

  test("+3 でも max を超えない", async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} max={2} />);
    await user.click(btn("+3"));
    expect(count()).toHaveTextContent("2");
  });

  test("リセットで initial に戻る", async () => {
    const user = userEvent.setup();
    render(<Counter initial={5} />);
    await user.click(btn("+"));
    await user.click(btn("+"));
    await user.click(btn("リセット"));
    expect(count()).toHaveTextContent("5");
  });

  test("onChange: 初回は呼ばず、操作ごとに新しい値で1回呼ぶ", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Counter onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();
    await user.click(btn("+"));
    expect(onChange).toHaveBeenLastCalledWith(1);
    await user.click(btn("+3"));
    expect(onChange).toHaveBeenLastCalledWith(4);
    await user.click(btn("リセット"));
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(onChange).toHaveBeenCalledTimes(3);
  });
});
