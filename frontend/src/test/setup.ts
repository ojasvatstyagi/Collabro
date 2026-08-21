import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Recent Node versions ship their own experimental `localStorage` global, which shadows jsdom's and is
// unusable here (undefined without --localstorage-file). Tests get a plain in-memory Storage instead.
const createMemoryStorage = (): Storage => {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => Array.from(items.keys())[index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, String(value));
    },
  };
};

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage());
});

// Vitest runs without globals, so Testing Library cannot register its own cleanup
afterEach(() => {
  cleanup();
});

// jsdom's Blob has no text() (every real browser does); the download error handling relies on it
if (!Blob.prototype.text) {
  Blob.prototype.text = function (this: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}
