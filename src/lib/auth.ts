const encoder = new TextEncoder();

const defaultUserId = "danyel-ii";

export const authCookieName = "study_blocks_session";
export const authSessionSeconds = 60 * 60 * 24 * 30;

function authUserId() {
  return process.env.STUDY_BLOCKS_USER_ID ?? defaultUserId;
}

function authPassword() {
  return process.env.STUDY_BLOCKS_PASSWORD ?? "";
}

function authSecret() {
  return process.env.STUDY_BLOCKS_AUTH_SECRET ?? process.env.STUDY_BLOCKS_PASSWORD ?? "";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlEncode(value: string) {
  return bytesToBase64Url(encoder.encode(value));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return diff === 0;
}

async function signingKey() {
  const secret = authSecret();
  if (!secret) {
    throw new Error("STUDY_BLOCKS_AUTH_SECRET or STUDY_BLOCKS_PASSWORD is required.");
  }
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload: string) {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createAuthToken(now = Date.now()) {
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: authUserId(),
      exp: now + authSessionSeconds * 1000,
    }),
  );
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAuthToken(token?: string | null, now = Date.now()) {
  if (!authSecret()) return false;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await sign(payload);
  if (!constantTimeEqual(base64UrlToBytes(signature), base64UrlToBytes(expected))) return false;

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as { sub?: string; exp?: number };
    return session.sub === authUserId() && typeof session.exp === "number" && session.exp > now;
  } catch {
    return false;
  }
}

export function validateCredentials(userId: string, password: string) {
  const configuredPassword = authPassword();
  if (!configuredPassword) return false;
  return (
    constantTimeEqual(encoder.encode(userId), encoder.encode(authUserId())) &&
    constantTimeEqual(encoder.encode(password), encoder.encode(configuredPassword))
  );
}
