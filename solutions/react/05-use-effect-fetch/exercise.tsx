/**
 * R-05 模範解答
 *
 * ポイント
 * - effect ごとに AbortController を作り、クリーンアップで abort() する
 *   → userId が変わると「前の effect のクリーンアップ → 新しい effect」の順で実行されるので、古いリクエストが必ず止まる
 * - abort された Promise は AbortError で reject される。signal.aborted を見て state 更新をスキップする
 *   （これで「遅れて届いた古い結果」も「abort によるエラー」も無視できる）
 * - 状態は TS-05 の判別可能なユニオンで持つと、loading と error が同時に立つような矛盾が起きない
 * - 再試行は「再取得のきっかけ」となる state（reloadKey）を依存配列に入れて effect を再実行させる
 * - StrictMode では開発時にマウント→アンマウント→マウントが走り effect が2回実行されるが、
 *   クリーンアップで abort しているので1回目は無害に捨てられる（＝正しくクリーンアップできているかの検査になっている）
 */
import { useEffect, useState } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface UserProfileProps {
  userId: number;
  fetchUser: (id: number, signal: AbortSignal) => Promise<User>;
}

type State = { status: "loading" } | { status: "success"; user: User } | { status: "error"; message: string };

export function UserProfile({ userId, fetchUser }: UserProfileProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetchUser(userId, controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return;
        setState({ status: "success", user });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: e instanceof Error ? e.message : "不明なエラー" });
      });

    return () => controller.abort();
  }, [userId, fetchUser, reloadKey]);

  switch (state.status) {
    case "loading":
      return <p>読み込み中...</p>;
    case "error":
      return (
        <div>
          <p role="alert">エラー: {state.message}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
            再試行
          </button>
        </div>
      );
    case "success":
      return (
        <div>
          <h2>{state.user.name}</h2>
          <p>{state.user.email}</p>
        </div>
      );
  }
}
