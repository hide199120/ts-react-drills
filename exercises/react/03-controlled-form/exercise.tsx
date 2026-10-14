/**
 * R-03 ★ 制御コンポーネント（controlled component）とフォームバリデーション
 *
 * 【課題】 SignupForm コンポーネントを作る。
 * - 入力欄（<label> と関連付けること）
 *     「メールアドレス」(type="email")、「パスワード」(type="password")、「パスワード（確認）」(type="password")
 *   ※ type="email" のブラウザ標準バリデーションに頼らないよう、<form> に noValidate を付ける
 * - 「登録」ボタンで送信（form の onSubmit を使う。Enter キーでも送信できるように）
 * - 送信時にバリデーションし、エラーがあれば role="alert" の要素にそれぞれ表示する
 *     - メールに "@" が含まれない → 「メールアドレスの形式が正しくありません」
 *     - パスワードが 8 文字未満 → 「パスワードは8文字以上で入力してください」
 *     - 確認用と一致しない → 「パスワードが一致しません」
 *   エラーは該当するものすべて表示する
 * - エラーが無ければ onSubmit({ email, password }) を呼び、全入力欄を空に戻し、エラー表示も消す
 * - パスワード欄の下に「N / 8 文字」と入力中の文字数をリアルタイム表示する（data-testid="password-length"）
 *
 * 【面接で聞かれること】
 * - 制御コンポーネントと非制御コンポーネント（useRef / FormData）の違いと使い分け
 * - e.preventDefault() を呼ばないと何が起きる？
 * - 入力のたびに再レンダーされるのはパフォーマンス的に問題？（通常は問題にならない）
 * - 実務ではフォームに React Hook Form + zod などを使う理由
 * - React 19 の form action / useActionState を知っている？
 */

export interface SignupValues {
  email: string;
  password: string;
}

export function SignupForm(props: { onSubmit: (values: SignupValues) => void }) {
  // TODO
  return null;
}
