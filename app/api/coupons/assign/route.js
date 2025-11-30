import { NextResponse } from "next/server";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

/** 產生優惠碼（複製你喜歡的版本） */
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

  const { userId, discountRate, validUntil } = await req.json();

  // 檢查 student 存在
  const user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json({ error: "找不到指定的使用者" }, { status: 404 });
  }
  if (user.role !== "student") {
    return NextResponse.json(
      { error: "只能把優惠券發給學生" },
      { status: 400 }
    );
  }

  // 效期處理
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
  if (discountRate == null || discountRate === "") {
    return NextResponse.json({ error: "折扣率必填" }, { status: 400 });
  }

  const rate = Number(discountRate);
  if (isNaN(rate) || rate < 0 || rate > 1) {
    return NextResponse.json(
      { error: "折扣率必須介於 0〜1 之間" },
      { status: 400 }
    );
  }

  // 產生不重複的優惠券碼
  let code = generateCouponCode();
  let existed = await Coupon.findOne({ code });

  while (existed) {
    code = generateCouponCode();
    existed = await Coupon.findOne({ code });
  }

  // 建立 coupon
  const coupon = await Coupon.create({
    code,
    discountRate: rate,
    validUntil: expireDate,
    assignedTo: user._id,
  });

  return NextResponse.json(
    {
      success: true,
      message: "優惠券已成功指定給學生",
      coupon,
    },
    { status: 201 }
  );
}

export const POST = withAuth(handler, { role: "admin" });
