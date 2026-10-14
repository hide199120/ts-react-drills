import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./exercise";

const email = () => screen.getByLabelText("メールアドレス");
const password = () => screen.getByLabelText("パスワード");
const confirm = () => screen.getByLabelText("パスワード（確認）");
const submit = () => screen.getByRole("button", { name: "登録" });

describe("R-03 SignupForm", () => {
  test("label と入力欄が関連付いている", () => {
    render(<SignupForm onSubmit={() => {}} />);
    expect(email()).toHaveAttribute("type", "email");
    expect(password()).toHaveAttribute("type", "password");
    expect(confirm()).toHaveAttribute("type", "password");
  });

  test("文字数をリアルタイム表示", async () => {
    const user = userEvent.setup();
    render(<SignupForm onSubmit={() => {}} />);
    expect(screen.getByTestId("password-length")).toHaveTextContent("0 / 8 文字");
    await user.type(password(), "abc");
    expect(screen.getByTestId("password-length")).toHaveTextContent("3 / 8 文字");
  });

  test("最初はエラーを出さない", () => {
    render(<SignupForm onSubmit={() => {}} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("不正な入力ではエラーを全部表示し、onSubmit を呼ばない", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);
    await user.type(email(), "invalid");
    await user.type(password(), "short");
    await user.type(confirm(), "different");
    await user.click(submit());

    const alerts = screen.getAllByRole("alert").map((a) => a.textContent);
    expect(alerts).toContain("メールアドレスの形式が正しくありません");
    expect(alerts).toContain("パスワードは8文字以上で入力してください");
    expect(alerts).toContain("パスワードが一致しません");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("一部だけ不正ならそのエラーだけ表示", async () => {
    const user = userEvent.setup();
    render(<SignupForm onSubmit={() => {}} />);
    await user.type(email(), "a@example.com");
    await user.type(password(), "password123");
    await user.type(confirm(), "password124");
    await user.click(submit());
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toHaveTextContent("パスワードが一致しません");
  });

  test("正しい入力なら onSubmit を呼び、フォームとエラーをクリア", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignupForm onSubmit={onSubmit} />);

    await user.click(submit()); // まずエラーを出す
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);

    await user.type(email(), "a@example.com");
    await user.type(password(), "password123");
    await user.type(confirm(), "password123{Enter}"); // Enter でも送信できる

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ email: "a@example.com", password: "password123" });
    expect(email()).toHaveValue("");
    expect(password()).toHaveValue("");
    expect(confirm()).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
