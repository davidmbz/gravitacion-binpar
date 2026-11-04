const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_TRACKED_KEYS = 5_000;

interface Window {
  startedAt: number;
  count: number;
}

// En memoria: frena ráfagas contra una instancia. En serverless cada instancia
// lleva su cuenta, así que no es un límite global. El README lo detalla.
const windows = new Map<string, Window>();

export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const current = windows.get(key);

  if (!current || now - current.startedAt >= WINDOW_MS) {
    if (windows.size >= MAX_TRACKED_KEYS) removeExpired(now);
    windows.set(key, { startedAt: now, count: 1 });
    return false;
  }

  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

function removeExpired(now: number): void {
  for (const [key, { startedAt }] of windows) {
    if (now - startedAt >= WINDOW_MS) windows.delete(key);
  }
}
