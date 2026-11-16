export const TOKEN_KEY = "pm_token";

export const SESSION_COOKIE = "pm_session=1; path=/; max-age=604800; samesite=lax";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = SESSION_COOKIE;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "pm_session=; path=/; max-age=0";
}

export async function api(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}
