import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Coupon from "@/models/Coupon";

export const runtime = "nodejs";

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  await connectDB();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const md = session.metadata || {};

    const enrollmentId = md.enrollmentId;
    const couponId = md.couponId; // 可能是空字串
    const paymentIntentId = session.payment_intent;

    const enrollment = await Enrollment.findById(enrollmentId);

    // 1) enrollment 找不到 → 不重送 webhook
    if (!enrollment) {
      console.error("❌ 找不到 enrollment：", enrollmentId);
      return NextResponse.json({ received: true });
    }

    // 2) 已付過 → 不重送 webhook
    if (enrollment.paid) {
      return NextResponse.json({ received: true });
    }

    // 3) 標記付款成功
    enrollment.paid = true;
    enrollment.paidAt = new Date();
    enrollment.paymentId = paymentIntentId;

    await enrollment.save();

    // 4) 作廢 coupon（避免 couponId 是空字串）
    if (couponId && couponId !== "") {
      await Coupon.findByIdAndUpdate(couponId, { isActive: false });
    }

    console.log("🎉 已成功開通課程 Enrollment:", enrollment._id.toString());
  }

  // 回 Stripe：永遠 200
  return NextResponse.json({ received: true });
}
