import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { withAuth } from "@/lib/withAuth";

async function handler(req) {
  await connectDB();

  const { oldPassword, newPassword, confirmPassword } = await req.json();

  if (!oldPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "請填入所有欄位" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "兩次輸入的密碼不一致" },
      { status: 400 }
    );
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "舊密碼錯誤" }, { status: 400 });
  }

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordPattern.test(newPassword)) {
    return NextResponse.json(
      { error: "新密碼至少8字元，須包含英文大小寫及數字" },
      { status: 400 }
    );
  }
  user.password = newPassword;
  await user.save();
  return NextResponse.json({ message: "密碼更新成功" }, { status: 200 });
}
export const PATCH = withAuth(handler);
