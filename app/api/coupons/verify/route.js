import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Coupon from "@/models/Coupon";

async function handler(req) {
  await connectDB();
  const { code } = await req.json();
  if (!code) {
    return NextResponse.json(
      { valid: false, message: "請輸入優惠代碼" },
      { status: 400 }
    );
  }

  const coupon = await Coupon.findOne({ code });

  if (!coupon) {
    return NextResponse.json(
      { valid: false, message: "找不到此優惠券" },
      { status: 404 }
    );
  }
  if (!coupon.isValid()) {
    return NextResponse.json(
      { valid: false, message: "此優惠券已失效或過期" },
      { status: 400 }
    );
  }
  return NextResponse.json(
    {
      valid: true,
      message: "優惠券可使用",
      discountRate: coupon.discountRate,
      validUntil: coupon.validUntil,
    },
    { status: 200 }
  );
}

export const POST = handler;
