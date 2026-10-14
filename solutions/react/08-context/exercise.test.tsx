import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, Header, LoginForm, useAuth, type User } from "./exercise";

function deferredLogin() {
  let resolve!: (u: User) => void;
  let reject!: (e: unknown) => void;
  const login = vi.fn(
    () =>
      new Promise<User>((res, rej) => {
        resolve = res;
        reject = rej;
      }),
  );
  return { login, resolve: (u: User) => resolve(u), reject: (e: unknown) => reject(e) };
}

function App({ login }: { login: (e: string, p: string) => Promise<User> }) {
  return (
    <AuthProvider login={login}>
      <Header />
      <main>
        <LoginForm />
      </main>
    </AuthProvider>
  );
}

describe("R-08 Context", () => {
  test("useAuth を Provider の外で使うとエラー", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow("useAuth は AuthProvider の中で使ってください");
    vi.mocked(console.error).mockRestore();
  });

  test("未ログインはゲスト", () => {
    render(<App login={vi.fn()} />);
    expect(screen.getByText("ゲスト")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ログアウト" })).not.toBeInTheDocument();
  });

  test("ログイン成功で Header とフォームが切り替わる", async () => {
    const user = userEvent.setup();
    const { login, resolve } = deferredLogin();
    render(<App login={login} />);

    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.type(screen.getByLabelText("パスワード"), "secret");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(login).toHaveBeenCalledWith("taro@example.com", "secret");
    expect(screen.getByRole("button", { name: "ログイン中..." })).toBeDisabled();

    await act(async () => resolve({ id: 1, name: "太郎" }));
    expect(screen.getByText("太郎 さん")).toBeInTheDocument();
    expect(screen.getByText("ログイン済みです")).toBeInTheDocument();
    expect(screen.queryByLabelText("メールアドレス")).not.toBeInTheDocument();
  });

  test("ログイン失敗でエラー表示、ボタンが戻る", async () => {
    const user = userEvent.setup();
    const { login, reject } = deferredLogin();
    render(<App login={login} />);
    await user.type(screen.getByLabelText("メールアドレス"), "x@example.com");
    await user.type(screen.getByLabelText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await act(async () => reject(new Error("401")));
    expect(screen.getByRole("alert")).toHaveTextContent("ログインに失敗しました");
    expect(screen.getByRole("button", { name: "ログイン" })).toBeEnabled();
    expect(screen.getByText("ゲスト")).toBeInTheDocument();
  });

  test("ログアウト", async () => {
    const user = userEvent.setup();
    const login = vi.fn(async () => ({ id: 1, name: "太郎" }));
    render(<App login={login} />);
    await user.type(screen.getByLabelText("メールアドレス"), "taro@example.com");
    await user.type(screen.getByLabelText("パスワード"), "secret");
    await user.click(screen.getByRole("button", { name: "ログイン" }));
    expect(await screen.findByText("太郎 さん")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ログアウト" }));
    expect(screen.getByText("ゲスト")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
  });

  test("useAuth().login は失敗時に例外を投げる", async () => {
    const login = vi.fn(async () => {
      throw new Error("401");
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider login={login}>{children}</AuthProvider>,
    });
    await act(async () => {
      await expect(result.current.login("a", "b")).rejects.toThrow("401");
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isLoggingIn).toBe(false);
  });
});
