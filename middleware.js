import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/account", "/instructor"];
function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}
function requiredRoleFor(pathname) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/instructor")) return "instructor";
  return null; // 其餘只要登入即可
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }
  const accessToken = req.cookies.get("accessToken")?.value;
  if (!accessToken) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  let payload;
  try {
    payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const needRole = requiredRoleFor(pathname);
  if (needRole && payload.role !== needRole) {
    const forbiddenUrl = new URL("/403", req.url);
    return NextResponse.redirect(forbiddenUrl);
  }
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", payload.id);
  requestHeaders.set("x-user-role", payload.role);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/instructor/:path*",
    "/admin/:path*",
  ],
};
