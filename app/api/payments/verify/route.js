import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Enrollment from "@/models/Enrollment";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 session_id" }, { status: 400 });
  }

  try {
    // 1) 去 Stripe 查詢 session 狀態
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // （注意：retrieve 找不到會 throw，不會回 null）

    const md = session.metadata || {};
    const enrollmentId = md.enrollmentId;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "付款記錄缺少 enrollmentId" },
        { status: 400 }
      );
    }

    // 2) 查詢 DB
    await connectDB();

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate("course", "title price")
      .populate("user", "email");

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "找不到 enrollment" },
        { status: 404 }
      );
    }

    // 4) 回傳「付款到底成功了沒？」
    const paid = session.payment_status === "paid" || enrollment.paid === true;

    return NextResponse.json(
      {
        success: true,
        paid,
        sessionStatus: session.payment_status,
        enrollment: {
          id: enrollment._id.toString(),
          courseTitle: enrollment.course?.title || "",
          finalPrice: enrollment.finalPrice,
          userEmail: enrollment.user?.email || "",
          paidAt: enrollment.paidAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Verify API Error:", err);
    return NextResponse.json(
      { success: false, error: "驗證失敗", detail: err.message },
      { status: 500 }
    );
  }
}
