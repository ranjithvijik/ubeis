/**
 * Safe localStorage access for cross-browser support.
 * Handles private browsing (StorageDisabled), quota exceeded, and security errors.
 */

function isStorageAvailable(): boolean {
  try {
    const key = '__storage_test__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
