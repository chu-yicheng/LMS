import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/account", "/instructor"];

function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function requiredRoleFor(pathname) {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/instructor")) return "instructor";
  return null;
}

function base64UrlToUint8Array(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJwtPayload(payload) {
  const bytes = base64UrlToUint8Array(payload);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function verifyAccessToken(token) {
  try {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const decodedHeader = decodeJwtPayload(header);
    if (decodedHeader.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToUint8Array(signature),
      new TextEncoder().encode(`${header}.${payload}`)
    );

    if (!verified) return null;

    const decodedPayload = decodeJwtPayload(payload);
    if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) return null;

    return decodedPayload;
  } catch {
    return null;
  }
}

function redirectToLogin(req, pathname) {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(req) {
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
    return redirectToLogin(req, pathname);
  }

  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    return redirectToLogin(req, pathname);
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
