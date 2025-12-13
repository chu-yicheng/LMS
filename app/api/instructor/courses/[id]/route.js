import { NextResponse } from "next/server";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Enrollment from "@/models/Enrollment";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";

async function handler(req, { params }) {
  await connectDB();
  const courseId = params.id;

  // 1) 找課程
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  // 2) 權限檢查
  if (String(course.instructor) !== String(req.user.id)) {
    return NextResponse.json(
      { error: "你沒有權限查看此課程" },
      { status: 403 }
    );
  }

  // 3) 統計已付款學生數
  const studentCount = await Enrollment.countDocuments({
    course: courseId,
    paid: true,
  });

  // 4) 計算總收入 (使用 Pipeline)
  const revenueResult = await Enrollment.aggregate([
    { $match: { course: courseId, paid: true } },
    { $group: { _id: null, total: { $sum: "$finalPrice" } } },
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // 5) 查課程章節
  const lessons = await Lesson.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  const formattedLessons = lessons.map((l) => ({
    id: l._id,
    title: l.title,
    order: l.order,
    videoUrl: l.videoUrl,
    createdAt: l.createdAt,
  }));

  // 6) 整合回傳資料
  return NextResponse.json(
    {
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        isPublished: course.isPublished,
        studentCount,
        totalRevenue,
        lessons: formattedLessons,
        createdAt: course.createdAt,
      },
    },
    { status: 200 }
  );
}

export const GET = withAuth(handler, { role: "instructor" });
