import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "@/models/User";
import RefreshToken from "@/models/RefreshToken";
import { connectDB } from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "找不到使用者" }, { status: 401 });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
    }
    const accessPayload = { id: user._id, role: user.role,email: user.email};
    const refreshPayload = { id: user._id };
    const accessToken = jwt.sign(accessPayload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(refreshPayload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + ttlMs),
    });
    const res = NextResponse.json({ message: "登入成功" }, { status: 200 });
    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ttlMs / 1000,
    });
    return res;
  } catch (err) {
    console.error("❌ 登入錯誤：", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
