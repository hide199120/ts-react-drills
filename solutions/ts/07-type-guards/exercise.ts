/**
 * TS-07 模範解答
 *
 * ポイント
 * - unknown は「何かわからない」型。使う前に必ず絞り込みが必要なので安全
 * - typeof null === "object" なので、オブジェクト判定では null を別途除外する
 * - `"key" in value` で value に key があると TS が認識してくれる（TS 4.9+）
 * - JSON.parse は例外を投げうるので try/catch。戻り値は any なので unknown で受ける
 */

export interface User {
  id: number;
  name: string;
  tags: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isUser(value: unknown): value is User {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((t) => typeof t === "string")
  );
}

export function parseUsers(json: string): User[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  return Array.isArray(data) ? data.filter(isUser) : [];
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (isRecord(error) && typeof error.message === "string") return error.message;
  return "不明なエラー";
}

export function pick<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
