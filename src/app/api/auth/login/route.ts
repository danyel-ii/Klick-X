import { NextResponse } from "next/server";
import { authCookieName, authSessionSeconds, createAuthToken, validateCredentials } from "@/lib/auth";
import { clearFailedLogins, clientKey, isLoginRateLimited, recordFailedLogin } from "@/lib/server/rate-limit";
import { assertSameOrigin, readJsonBody, RequestSecurityError } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const key = clientKey(request);
  if (isLoginRateLimited(key)) {
    return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
  }

  let body: { userId?: unknown; password?: unknown };
  try {
    body = (await readJsonBody(request, 8 * 1024)) as { userId?: unknown; password?: unknown };
  } catch (error) {
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  if (typeof body?.userId !== "string" || typeof body.password !== "string" || body.userId.length > 160 || body.password.length > 1024) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
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
