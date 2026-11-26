export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;

    try {
      const data = await res.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Keep the default error message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return res.json();
}
