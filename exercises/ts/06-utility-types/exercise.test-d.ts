import { expectTypeOf } from "vitest";
import type * as T from "./exercise";

type P = "low" | "medium" | "high";

describe("TS-06 utility types", () => {
  test("1. TodoListItem", () => {
    expectTypeOf<T.TodoListItem>().toEqualTypeOf<{ id: number; title: string; done: boolean }>();
  });

  test("2. TodoInput", () => {
    expectTypeOf<T.TodoInput>().toEqualTypeOf<{
      title: string;
      description?: string;
      done: boolean;
      priority: P;
      assignee: string | null;
    }>();
  });

  test("3. TodoPatch", () => {
    expectTypeOf<T.TodoPatch>().toEqualTypeOf<{
      title?: string;
      description?: string;
      done?: boolean;
      priority?: P;
      createdAt?: Date;
      assignee?: string | null;
    }>();
  });

  test("4. CompleteTodo", () => {
    expectTypeOf<T.CompleteTodo>().toEqualTypeOf<{
      id: number;
      title: string;
      description: string;
      done: boolean;
      priority: P;
      createdAt: Date;
      assignee: string | null;
    }>();
  });

  test("5. FrozenTodo", () => {
    expectTypeOf<T.FrozenTodo>().toEqualTypeOf<Readonly<T.Todo>>();
    const t = {} as T.FrozenTodo;
    // @ts-expect-error readonly
    t.title = "x";
  });

  test("6. TodoMap", () => {
    expectTypeOf<T.TodoMap>().toEqualTypeOf<{ [id: number]: T.Todo }>();
  });

  test("7. PriorityLabels", () => {
    expectTypeOf<T.PriorityLabels>().toEqualTypeOf<{ low: string; medium: string; high: string }>();
  });

  test("8. FetchTodoResult", () => {
    expectTypeOf<T.FetchTodoResult>().toEqualTypeOf<T.Todo>();
  });

  test("9. FetchTodoOptions", () => {
    expectTypeOf<T.FetchTodoOptions>().toEqualTypeOf<{ signal?: AbortSignal } | undefined>();
  });

  test("10. Assignee", () => {
    expectTypeOf<T.Assignee>().toEqualTypeOf<string>();
  });

  test("11. NormalPriority", () => {
    expectTypeOf<T.NormalPriority>().toEqualTypeOf<"low" | "medium">();
  });
});
