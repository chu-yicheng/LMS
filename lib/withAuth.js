import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function withAuth(handler, options = {}) {
  return async function authenticatedRoute(req, context) {
    const { role: requiredRole } = options;
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return NextResponse.json(
        { error: "伺服器驗證設定缺失" },
        { status: 500 }
      );
    }

    let payload;
    try {
      payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch {
      return NextResponse.json(
        { error: "AccessToken 已失效" },
        { status: 401 }
      );
    }

    if (requiredRole && payload.role !== requiredRole) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    return handler(req, context);
  };
}
