import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { withAuth } from "@/lib/withAuth";

async function handler(req, { params }) {
  await connectDB();

  const courseId = params.id;

  // 1) 確認課程存在
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  // 2) 權限檢查 — 只有講師本人能看學生清單
  if (String(course.instructor) !== req.user.id) {
    return NextResponse.json(
      { error: "只有講師本人能查看此課程的學生列表" },
      { status: 403 }
    );
  }

  // 3) 查詢 enrollment → 取得 student 清單
  const enrollments = await Enrollment.find({ course: courseId })
    .populate("user", "username email")
    .lean();

  const students = enrollments.map((e) => ({
    id: e.user._id,
    username: e.user.username,
    email: e.user.email,
    enrolledAt: e.createdAt,
  }));

  return NextResponse.json(
    {
      message: "取得學生列表成功",
      courseTitle: course.title,
      students,
      studentCount: students.length,
    },
    { status: 200 }
  );
}

export const GET = withAuth(handler, { role: "instructor" });
