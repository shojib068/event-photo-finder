/** Browser-side JSON client for the app's own API. Errors use `{ error: { code, message } }`. */

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
  }
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { error?: { code?: string } };
    return new ApiError(res.status, body.error?.code ?? 'UNKNOWN');
  } catch {
    return new ApiError(res.status, 'UNKNOWN');
  }
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-store', ...init });
  } catch {
    throw new ApiError(0, 'NETWORK');
  }
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export function apiJson<T>(url: string, method: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

export function errorCode(err: unknown): string {
  return err instanceof ApiError ? err.code : 'UNKNOWN';
}
