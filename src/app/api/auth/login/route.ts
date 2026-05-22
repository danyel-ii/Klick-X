import { NextResponse } from "next/server";
import { authCookieName, authSessionSeconds, createAuthToken, validateCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string; password?: string } | null;
  const userId = body?.userId?.trim() ?? "";
  const password = body?.password ?? "";

  if (!validateCredentials(userId, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

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
