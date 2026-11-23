// Browser-side API helper: never throws, and never fails on an empty or non-JSON response body
// (e.g. a platform timeout page), so UI code can always show a message instead of crashing.

export type ApiBody = Record<string, unknown> & { error?: string; message?: string };

export async function callApi<T extends object = ApiBody>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ ok: boolean; status: number; body: T & ApiBody }> {
  try {
    const response = await fetch(url, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const text = await response.text();
    let body = {} as T & ApiBody;
    try {
      body = (text ? JSON.parse(text) : {}) as T & ApiBody;
    } catch {
      // Not JSON: fall through with an empty body so the caller's default message is used.
    }
    if (response.status === 401 && !body.error) body = { ...body, error: "Your session has ended. Please sign in again." };
    if (response.status === 504 && !body.error) body = { ...body, error: "The server took too long to respond. Please try again." };
    return { ok: response.ok, status: response.status, body };
  } catch {
    return { ok: false, status: 0, body: { error: "Network error. Check your connection and try again." } as T & ApiBody };
  }
}
