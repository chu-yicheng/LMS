import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectDB();
    const { username, email, password, role } = await req.json();

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: "所有欄位皆必填" }, { status: 400 });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "此信箱已註冊過了" }, { status: 401 });
    }
    await User.create({ username, email, password, role });
    return NextResponse.json(
      { message: "註冊成功，請前往登入" },
      { status: 201 }
    );
  } catch (err) {
    console.error("註冊錯誤：", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
