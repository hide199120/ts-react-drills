/**
 * R-03 模範解答
 *
 * ポイント
 * - 入力値を state に持ち、value と onChange で双方向に結ぶ＝制御コンポーネント
 * - 複数の入力は1つのオブジェクト state にまとめ、name 属性でキーを切り替えると記述が減る
 * - バリデーションは純粋関数（validate）に切り出すとテストしやすい
 * - <label htmlFor> と <input id> を対応させる。useId で一意な id を作る（同じフォームを複数置いても衝突しない）
 * - 送信は button の onClick ではなく form の onSubmit。Enter キー送信やアクセシビリティが自然に効く
 */
import { useId, useState, type ChangeEvent, type FormEvent } from "react";

export interface SignupValues {
  email: string;
  password: string;
}

const initialForm = { email: "", password: "", confirm: "" };
type FormState = typeof initialForm;

function validate(form: FormState): string[] {
  const errors: string[] = [];
  if (!form.email.includes("@")) errors.push("メールアドレスの形式が正しくありません");
  if (form.password.length < 8) errors.push("パスワードは8文字以上で入力してください");
  if (form.password !== form.confirm) errors.push("パスワードが一致しません");
  return errors;
}

export function SignupForm({ onSubmit }: { onSubmit: (values: SignupValues) => void }) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<string[]>([]);
  const id = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (found.length > 0) return;
    onSubmit({ email: form.email, password: form.password });
    setForm(initialForm);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor={`${id}-email`}>メールアドレス</label>
        <input id={`${id}-email`} name="email" type="email" value={form.email} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor={`${id}-password`}>パスワード</label>
        <input id={`${id}-password`} name="password" type="password" value={form.password} onChange={handleChange} />
        <small data-testid="password-length">{form.password.length} / 8 文字</small>
      </div>
      <div>
        <label htmlFor={`${id}-confirm`}>パスワード（確認）</label>
        <input id={`${id}-confirm`} name="confirm" type="password" value={form.confirm} onChange={handleChange} />
      </div>
      {errors.map((message) => (
        <p key={message} role="alert">
          {message}
        </p>
      ))}
      <button type="submit">登録</button>
    </form>
  );
}
