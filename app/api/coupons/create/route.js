import { NextResponse } from "next/server";
import Coupon from "@/models/Coupon";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import User from "@/models/User";

function generateCouponCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function handler(req) {
  await connectDB();

  // ❗ 必須 await，不能忘記
  const { code, discountRate, validUntil, assignedTo } = await req.json();

  // ---- 折扣率驗證 ----
  if (discountRate == null || discountRate === "") {
    return NextResponse.json({ error: "折扣率必填" }, { status: 400 });
  }

  const rate = Number(discountRate);
  if (isNaN(rate)) {
    return NextResponse.json({ error: "折扣率必須為數值" }, { status: 400 });
  }

  if (rate < 0 || rate > 1) {
    return NextResponse.json(
      { error: "折扣率必須在 0～1 之間" },
      { status: 400 }
    );
  }

  // ---- code 格式驗證 ----
  if (code) {
    const regex = /^[A-Z0-9]{10}$/; // ❗ 你原本拼錯 reqex → regex
    if (!regex.test(code)) {
      return NextResponse.json(
        { error: "優惠碼格式錯誤，必須是 10 碼大寫英數字" },
        { status: 400 }
      );
    }
  }

  // ---- 優惠碼重複驗證 ----
  let finalCode = code || generateCouponCode();
  const existed = await Coupon.findOne({ code: finalCode });
  if (existed) {
    return NextResponse.json(
      { error: "此優惠券已存在，請更換或留空讓系統自動產生" },
      { status: 400 }
    );
  }

  // ---- 指定使用者驗證 ----
  let assignedUser = null;
  if (assignedTo) {
    assignedUser = await User.findById(assignedTo).lean();
    if (!assignedUser) {
      return NextResponse.json(
        { error: "assignedTo 指定的使用者不存在" },
        { status: 404 }
      );
    }
  }

  // ---- 日期驗證 ----
  let expireDate;
  if (validUntil) {
    const ts = Date.parse(validUntil);
    if (isNaN(ts)) {
      return NextResponse.json(
        { error: "validUntil 必須是有效日期（YYYY-MM-DD）" },
        { status: 400 }
      );
    }
    expireDate = new Date(ts);
  }

  // ---- 建立優惠券 ----
  const coupon = await Coupon.create({
    code: finalCode,
    discountRate: rate,
    validUntil: expireDate,
    assignedTo: assignedUser ? assignedUser._id : undefined,
  });

  return NextResponse.json(
    {
      success: true,
      message: "優惠券建立成功",
      coupon,
    },
    { status: 201 }
  );
}

export const POST = withAuth(handler, { role: "admin" });
