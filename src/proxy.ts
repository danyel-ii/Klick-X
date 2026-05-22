import { NextRequest, NextResponse } from "next/server";
import { authCookieName, verifyAuthToken } from "./lib/auth";

const publicRoutes = new Set(["/login", "/api/auth/login", "/api/auth/logout"]);

function isPublicPath(pathname: string) {
  return (
    publicRoutes.has(pathname) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?)$/i.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authenticated = await verifyAuthToken(request.cookies.get(authCookieName)?.value);

  if (pathname === "/login") {
    if (!authenticated) return NextResponse.next();
    const nextPath = request.nextUrl.searchParams.get("next");
    const destination = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/today";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  if (isPublicPath(pathname)) return NextResponse.next();
  if (authenticated) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
