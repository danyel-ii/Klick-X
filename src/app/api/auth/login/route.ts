import { NextResponse } from "next/server";
import { authCookieName, authSessionSeconds, createAuthToken, validateCredentials } from "@/lib/auth";
import { clearFailedLogins, clientKey, isLoginRateLimited, recordFailedLogin } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const key = clientKey(request);
  if (isLoginRateLimited(key)) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { userId?: string; password?: string } | null;
  const userId = body?.userId?.trim() ?? "";
  const password = body?.password ?? "";

  if (!validateCredentials(userId, password)) {
    recordFailedLogin(key);
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  clearFailedLogins(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(authCookieName, await createAuthToken(), {
    httpOnly: true,
    maxAge: authSessionSeconds,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });
  return response;
}
