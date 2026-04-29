const KEY = "pressit:user-uuid";

export function getStoredUserUuid(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(KEY);
}

export function getOrCreateUserUuid(): string {
  const existing = getStoredUserUuid();

  if (existing) {
    return existing;
  }

  if (typeof window === "undefined") {
    throw new Error("getOrCreateUserUuid must be called in the browser");
  }

  const generated = crypto.randomUUID();
  window.localStorage.setItem(KEY, generated);
  return generated;
}
