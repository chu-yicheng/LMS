import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RefreshToken from "@/models/RefreshToken";

import { withAuth } from "@/lib/withAuth";

async function handler(req) {
  await connectDB();
  const refreshToken = req.cookies.get("refreshToken")?.value;
  if (refreshToken) {
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken }, // 查詢條件
      { revoked: true } // 更新內容
    );
  }
  const res = NextResponse.json({ message: "登出成功" }, { status: 200 });

  res.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

export const POST = withAuth(handler);
