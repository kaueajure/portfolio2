export async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers:
      body instanceof FormData
        ? {}
        : body === undefined
          ? {}
          : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Não foi possível concluir.");
  return data as T;
}
