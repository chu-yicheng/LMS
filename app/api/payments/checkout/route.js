import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Coupon from "@/models/Coupon";
import User from "@/models/User";

async function handler(req) {
  await connectDB();

  const { courseId, couponCode } = await req.json();

  if (!courseId) {
    return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
  }

  // 1) 找課程
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  if (!course.price || course.price <= 0) {
    return NextResponse.json({ error: "課程價格異常" }, { status: 400 });
  }
  const user = await User.findById(req.user.id).select("email role isBanned");
  if (!user) {
    return NextResponse.json(
      { error: "使用者不存在或以刪除" },
      { status: 403 }
    );
  }
  if (user.isBanned) {
    return NextResponse.json({ error: "你沒有使用權限" }, { status: 403 });
  }
  if (user.role.toString() !== "student") {
    return NextResponse.json(
      { error: "只有學生可以購買課程" },
      { status: 403 }
    );
  }

  // 2) 找 enrollment（從使用者報名結果）
  let enrollment = await Enrollment.findOne({
    user: user._id,
    course: courseId,
  });

  // 如果有紀錄而且已付過款
  if (enrollment?.paid) {
    return NextResponse.json({ error: "你已經購買過此課程" }, { status: 409 });
  }

  // 3) 若還沒有 enrollment → 建立一筆（paid=false）
  if (!enrollment) {
    enrollment = await Enrollment.create({
      user: user._id,
      course: courseId,
      discountRate: 0, // ⚠ 若前端要用優惠券，這邊會跟 enroll API 配合
      paid: false,
    });
  }

  let couponDoc = null;
  let discountRate = 0;
  if (couponCode) {
    couponDoc = await Coupon.findOne({ code: couponCode });
    if (!couponDoc) {
      return NextResponse.json({ error: "找不到此優惠券" }, { status: 404 });
    }
    if (!couponDoc.isValid()) {
      return NextResponse.json(
        { error: "此優惠券已過期或無效" },
        { status: 400 }
      );
    }
    if (
      couponDoc.assignedTo &&
      couponDoc.assignedTo.toString() !== user.id.toString()
    ) {
      return NextResponse.json(
        { error: "你無權使用此優惠劵" },
        { status: 403 }
      );
    }

    discountRate = couponDoc.discountRate ?? 0;
  }

  const originalPrice = course.price;
  const finalPrice = Math.max(
    0,
    Math.round(originalPrice * (1 - discountRate))
  );

  // 7) 更新 Enrollment（交易快照）
  enrollment.originalPrice = originalPrice;
  enrollment.discountRate = discountRate;
  enrollment.finalPrice = finalPrice;
  enrollment.coupon = couponDoc ? couponDoc._id : null;
  enrollment.paid = false; // 一定是未付款狀態
  await enrollment.save();

  // 4) Stripe 結帳（真正收款的金額是 enrollment.finalPrice）
  const amountInCents = Math.round(finalPrice * 100); // TWD → 分
  const currency = course.currency || "twd";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    metadata: {
      enrollmentId: enrollment._id.toString(),
      userId: user._id.toString(),
      courseId: courseId.toString(),
      couponId: couponDoc ? couponDoc._id.toString() : "",
      originalPrice: originalPrice.toString(),
      discountRate: discountRate.toString(),
      finalPrice: finalPrice.toString(),
    },
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: course.title,
            description: course.description?.slice(0, 200),
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?courseId=${courseId}`,
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}

export const POST = withAuth(handler, { role: "student" });
