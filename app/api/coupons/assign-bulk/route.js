import { NextResponse } from "next/server";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";

/** 產生優惠碼（10 碼英數字） */
function generateCouponCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
}

/** 產生不重複 code（包含 DB 檢查） */
async function generateUniqueCode() {
  let code = generateCouponCode();
  let existed = await Coupon.findOne({ code });

  while (existed) {
    code = generateCouponCode();
    existed = await Coupon.findOne({ code });
  }

  return code;
}

async function handler(req) {
  await connectDB();

  const { discountRate, validUntil } = await req.json();

  // ---- 折扣率驗證 ----
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
    expireDate.setHours(23, 59, 59, 999);
  }

  // ---- 找出所有學生 ----
  const students = await User.find({ role: "student" }).lean();

  if (!students.length) {
    return NextResponse.json(
      { error: "目前系統中沒有學生可以發送優惠券" },
      { status: 400 }
    );
  }

  // ---- 為每位學生建立優惠券 ----
  const createdCoupons = [];

  for (const student of students) {
    const code = await generateUniqueCode();

    const coupon = await Coupon.create({
      code,
      discountRate: rate,
      validUntil: expireDate,
      assignedTo: student._id,
    });

    createdCoupons.push(coupon);
  }

  return NextResponse.json(
    {
      success: true,
      message: `已成功為 ${students.length} 位學生建立優惠券`,
      count: createdCoupons.length,
    },
    { status: 201 }
  );
}

export const POST = withAuth(handler, { role: "admin" });
