import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { withAuth } from "@/lib/withAuth";

async function handler(req, { params }) {
  await connectDB();

  const courseId = params.id;

  // 1) 找課程
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  // 2) 確認講師本人
  if (String(course.instructor) !== String(req.user.id)) {
    return NextResponse.json(
      { error: "你沒有權限查看這門課的報名資訊" },
      { status: 403 }
    );
  }

  // 3) 查所有報名資料（Enrollment）
  const enrollments = await Enrollment.find({ course: courseId })
    .populate("user", "username email")
    .sort({ enrolledAt: -1 })
    .lean();

  // 4) 整理回傳資料
  const result = enrollments.map((e) => ({
    enrollmentId: e._id,
    student: {
      id: e.user._id,
      username: e.user.username,
      email: e.user.email,
    },
    discountRate: e.discountRate,
    finalPrice: e.finalPrice,
    paid: e.paid,
    paymentId: e.paymentId,
    enrolledAt: e.enrolledAt,
  }));

  return NextResponse.json(
    {
      message: "成功取得報名列表",
      course: {
        id: course._id,
        title: course.title,
      },
      enrollments: result,
    },
    { status: 200 }
  );
}

export const GET = withAuth(handler, { role: "instructor" });
