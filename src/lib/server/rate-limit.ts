type Bucket = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, Bucket>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 10;
const maxTrackedClients = 10_000;

function pruneBuckets(now: number) {
  for (const [key, bucket] of loginAttempts) {
    if (bucket.resetAt <= now) loginAttempts.delete(key);
  }
  while (loginAttempts.size >= maxTrackedClients) {
    const oldest = loginAttempts.keys().next().value;
    if (oldest === undefined) break;
    loginAttempts.delete(oldest);
  }
}

function bucketFor(key: string, now: number) {
  const current = loginAttempts.get(key);
  if (current && current.resetAt > now) return current;
  pruneBuckets(now);
  const next = { count: 0, resetAt: now + windowMs };
  loginAttempts.set(key, next);
  return next;
}

export function clientKey(request: Request) {
  const candidate = (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
  return candidate.slice(0, 128);
}

export function isLoginRateLimited(key: string, now = Date.now()) {
  return bucketFor(key, now).count >= maxAttempts;
}

export function recordFailedLogin(key: string, now = Date.now()) {
  bucketFor(key, now).count += 1;
}

export function clearFailedLogins(key: string) {
  loginAttempts.delete(key);
}
