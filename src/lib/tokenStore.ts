const tokens = new Map<string, { createdAt: number }>();

const TOKEN_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL = 300_000;

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of tokens) {
      if (now - entry.createdAt > TOKEN_TTL_MS) {
        tokens.delete(key);
      }
    }
    if (tokens.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL);
}

ensureCleanup();

export function storeToken(token: string): void {
  tokens.set(token, { createdAt: Date.now() });
}

export function validateToken(token: string | undefined): boolean {
  if (!token) return false;
  const entry = tokens.get(token);
  if (!entry) return false;
  if (Date.now() - entry.createdAt > TOKEN_TTL_MS) {
    tokens.delete(token);
    return false;
  }
  return true;
}
