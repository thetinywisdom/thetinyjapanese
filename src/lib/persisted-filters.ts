// Lightweight localStorage helpers for persisting per-mode filter selections.

export function loadFilters<T extends object>(key: string, defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    return { ...defaults, ...(parsed as Partial<T>) };
  } catch {
    return defaults;
  }
}

export function saveFilters<T>(key: string, filters: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(filters));
  } catch {
    /* ignore quota / serialization errors */
  }
}
