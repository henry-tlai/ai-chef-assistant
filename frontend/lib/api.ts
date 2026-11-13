export const API_URL = "http://127.0.0.1:8000";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}