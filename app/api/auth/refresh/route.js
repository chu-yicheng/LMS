import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import RefreshToken from "@/models/RefreshToken";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST() {
  try {
    await connectDB();
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { error: "未找到 refreshToken，請重新登入" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      return NextResponse.json(
        { error: "Refresh token 已過期或無效" },
        { status: 403 }
      );
    }
    const storedToken = await RefreshToken.findOne({
      user: payload.id,
      token: refreshToken,
      revoked: false,
    });
    if (!storedToken) {
      return NextResponse.json(
        { error: "登入狀態已失效，請重新登入" },
        { status: 403 }
      );
    }
    const user = await User.findById(payload.id);
    if (!user) {
      return NextResponse.json({ error: "使用者不存在" }, { status: 403 });
    }
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    const res = NextResponse.json({ message: "Access token 已更新" });
    res.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return res;
  } catch (err) {
    console.error("❌ refresh 伺服器錯誤：", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
