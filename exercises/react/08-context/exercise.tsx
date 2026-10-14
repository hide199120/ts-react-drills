/**
 * R-08 ★★★ Context による状態共有（ログイン状態）
 *
 * 【課題】 認証状態をアプリ全体で共有する仕組みを作る。
 *
 * 1. AuthProvider（props: children, login 関数）
 *    - login: (email, password) => Promise<User>  ※テストのため外から渡す
 *    - 子孫に { user, login, logout, isLoggingIn } を提供する
 *      - user: ログイン中のユーザー or null
 *      - login(email, password): props の login を呼び、成功したら user をセット。失敗したら例外をそのまま投げる
 *      - logout(): user を null に
 *      - isLoggingIn: login 実行中は true
 *
 * 2. useAuth()
 *    - Context の値を返すフック
 *    - AuthProvider の外で使われたら Error("useAuth は AuthProvider の中で使ってください") を投げる
 *
 * 3. Header コンポーネント
 *    - ログイン中: 「{name} さん」と「ログアウト」ボタン
 *    - 未ログイン: 「ゲスト」
 *
 * 4. LoginForm コンポーネント
 *    - 「メールアドレス」「パスワード」入力欄と「ログイン」ボタン
 *    - ログイン中（isLoggingIn）はボタンを disabled にし、テキストを「ログイン中...」にする
 *    - 失敗したら role="alert" で「ログインに失敗しました」
 *    - ログイン済みなら フォームの代わりに「ログイン済みです」を表示
 *
 * 【ルール】 Header と LoginForm は props を受け取らない（useAuth だけで動く）こと
 *
 * 【面接で聞かれること】
 * - props のバケツリレー（prop drilling）とは？ Context はそれをどう解決する？
 * - Context の値が変わると、どのコンポーネントが再レンダーされる？
 * - Provider の value にオブジェクトリテラルを直接渡すと何が問題？（毎回新しい参照 → useMemo）
 * - createContext のデフォルト値を undefined にして、カスタムフックでチェックするパターンの利点
 * - Context と状態管理ライブラリ（Zustand / Jotai / Redux）の使い分け
 */
import type { ReactNode } from "react";

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

export function AuthProvider(props: { children: ReactNode; login: (email: string, password: string) => Promise<User> }) {
  // TODO
  return null;
}

export function useAuth(): AuthContextValue {
  throw new Error("TODO");
}

export function Header() {
  // TODO
  return null;
}

export function LoginForm() {
  // TODO
  return null;
}
