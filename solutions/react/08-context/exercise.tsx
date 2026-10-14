/**
 * R-08 模範解答
 *
 * ポイント
 * - createContext のデフォルトを undefined にし、useAuth で undefined チェック → Provider 忘れを即座に検出
 * - Provider の value は useMemo、関数は useCallback で参照を安定させる
 *   （value が毎回新しいオブジェクトだと、Provider が再レンダーするたびに全ての consumer も再レンダーされる）
 * - login は try/finally で isLoggingIn を必ず false に戻す。エラーは握りつぶさず呼び出し側（UI）に任せる
 * - React 19 では <AuthContext value={...}> と書ける（.Provider 省略可）。ここでは互換性のため .Provider
 */
import { createContext, useCallback, useContext, useId, useMemo, useState, type FormEvent, type ReactNode } from "react";

export interface User {
  id: number;
  name: string;
}

export interface AuthContextValue {
  user: User | null;
  isLoggingIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  login: loginApi,
}: {
  children: ReactNode;
  login: (email: string, password: string) => Promise<User>;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoggingIn(true);
      try {
        setUser(await loginApi(email, password));
      } finally {
        setIsLoggingIn(false);
      }
    },
    [loginApi],
  );

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, isLoggingIn, login, logout }), [user, isLoggingIn, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth は AuthProvider の中で使ってください");
  return ctx;
}

export function Header() {
  const { user, logout } = useAuth();
  return (
    <header>
      {user ? (
        <>
          <span>{user.name} さん</span>
          <button type="button" onClick={logout}>
            ログアウト
          </button>
        </>
      ) : (
        <span>ゲスト</span>
      )}
    </header>
  );
}

export function LoginForm() {
  const { user, login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const id = useId();

  if (user) return <p>ログイン済みです</p>;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(false);
    try {
      await login(email, password);
    } catch {
      setError(true);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={`${id}-email`}>メールアドレス</label>
      <input id={`${id}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <label htmlFor={`${id}-password`}>パスワード</label>
      <input id={`${id}-password`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p role="alert">ログインに失敗しました</p>}
      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
