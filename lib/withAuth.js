import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function withAuth(handler, options = {}) {
  return async function (req) {
    const { role: requiredRole } = options;

    // 1) 讀取 accessToken
    const accessToken = req.cookies.get("accessToken")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    // 2) 驗證 Token
    let payload;
    try {
      payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "AccessToken 已失效" },
        { status: 401 }
      );
    }

    // 3) 角色權限判斷（若有要求角色）
    if (requiredRole && payload.role !== requiredRole) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    // 4) 注入到 req，讓 handler 可以讀 req.user
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    // 5) 通過驗證 → 執行真正業務邏輯
    return handler(req);
  };
}
