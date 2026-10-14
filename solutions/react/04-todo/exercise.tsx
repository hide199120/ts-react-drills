/**
 * R-04 模範解答
 *
 * ポイント
 * - 追加: [...prev, newTodo] / 更新: prev.map(...) / 削除: prev.filter(...)。いずれも新しい配列を返す
 * - 表示用リスト・残り件数は todos と filter から毎レンダー計算する（state にしない）
 *   重い計算でなければ useMemo も不要
 * - フィルタの種類は union 型 + 定数配列で管理すると、ボタン描画と型が一致する
 * - useState(initialTodos) は初回だけ使われる。props が変わっても state は自動では追従しない点に注意
 */
import { useState, type FormEvent } from "react";

export interface Todo {
  id: string;
  title: string;
  done: boolean;
}

const FILTERS = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "completed", label: "完了" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

export function TodoApp({ initialTodos = [] }: { initialTodos?: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<Filter>("all");
  const [text, setText] = useState("");

  const visibleTodos = todos.filter((t) => (filter === "all" ? true : filter === "active" ? !t.done : t.done));
  const remaining = todos.filter((t) => !t.done).length;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), title, done: false }]);
    setText("");
  };

  const toggle = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const remove = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          新しいタスク
          <input value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button type="submit">追加</button>
      </form>

      <div>
        {FILTERS.map((f) => (
          <button key={f.value} type="button" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      <ul>
        {visibleTodos.map((todo) => (
          <li key={todo.id}>
            <label>
              <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
              {todo.title}
            </label>
            <button type="button" aria-label={`${todo.title}を削除`} onClick={() => remove(todo.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>

      <p>残り {remaining} 件</p>
    </div>
  );
}
