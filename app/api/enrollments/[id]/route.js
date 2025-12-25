import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";

async function deleteHandler(req, { params }) {
  await connectDB();
  const id = params.id;

  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    return NextResponse.json({ error: "找不到報名資料" }, { status: 404 });
  }

  if (String(enrollment.user) !== String(req.user.id)) {
    return NextResponse.json({ error: "無權退選此課程" }, { status: 403 });
  }

  // 刪除 enrollment（正規化 → 不用更動 Course 或 User）
  await Enrollment.findByIdAndDelete(id);

  return NextResponse.json(
    { success: true, message: "退選成功" },
    { status: 200 }
  );
}
async function getHandler(req, { params }) {
  await connectDB();

  const enrollmentId = params.id;

  // 1) 找報名資料
  const enrollment = await Enrollment.findById(enrollmentId)
    .populate("course", "title price instructor")
    .populate("user", "username email")
    .lean();

  if (!enrollment) {
    return NextResponse.json({ error: "找不到報名資料" }, { status: 404 });
  }

  // 2) 確認報名者本人
  if (String(enrollment.user._id) !== String(req.user.id)) {
    return NextResponse.json(
      { error: "你沒有權限查看此報名資料" },
      { status: 403 }
    );
  }

  // 3) 自動補充課程講師資料
  const courseInfo = await Course.findById(enrollment.course._id)
    .populate("instructor", "username email")
    .lean();

  return NextResponse.json(
    {
      message: "取得報名詳情成功",
      enrollment: {
        id: enrollment._id,
        user: {
          id: enrollment.user._id,
          username: enrollment.user.username,
          email: enrollment.user.email,
        },
        course: {
          id: courseInfo._id,
          title: courseInfo.title,
          instructor: {
            name: courseInfo.instructor.username,
            email: courseInfo.instructor.email,
          },
        },
        discountRate: enrollment.discountRate,
        finalPrice: enrollment.finalPrice,
        paid: enrollment.paid,
        paymentId: enrollment.paymentId,
        enrolledAt: enrollment.enrolledAt,
      },
    },
    { status: 200 }
  );
}

export const DELETE = withAuth(deleteHandler, { role: "student" });
export const GET = withAuth(getHandler, { role: "student" });
