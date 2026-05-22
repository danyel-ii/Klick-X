import { NextResponse } from "next/server";
import { authCookieName, verifyAuthToken } from "@/lib/auth";

function cookieValue(header: string | null, name: string) {
  if (!header) return null;
  const prefix = `${name}=`;
  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie ? cookie.slice(prefix.length) : null;
}

export async function isAuthorizedRequest(request: Request) {
  return verifyAuthToken(cookieValue(request.headers.get("cookie"), authCookieName));
}

export function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}
