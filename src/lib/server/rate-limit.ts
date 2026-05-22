type Bucket = {
  count: number;
  resetAt: number;
};

const loginAttempts = new Map<string, Bucket>();
const windowMs = 10 * 60 * 1000;
const maxAttempts = 10;

function bucketFor(key: string, now: number) {
  const current = loginAttempts.get(key);
  if (current && current.resetAt > now) return current;
  const next = { count: 0, resetAt: now + windowMs };
  loginAttempts.set(key, next);
  return next;
}

export function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
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
