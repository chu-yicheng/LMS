import { NextResponse } from "next/server";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Enrollment from "@/models/Enrollment";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";

async function getHandler(req, { params }) {
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

async function patchHandler(req, { params }) {
  await connectDB();
  const courseId=params.id
  // 🔹 安全取得 body，避免 req.json() 直接炸掉
  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    // 如果真的連 JSON 都 parse 不出來，就直接回 400
    return NextResponse.json(
      { error: "請提供正確的 JSON 格式資料" },
      { status: 400 }
    );
  }

  const { title, description, price, isPublished } = body;

  // 1) 找課程
  const course = await Course.findById(courseId)
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  // 2) 權限檢查
  if (String(course.instructor) !== String(req.user.id)) {
    return NextResponse.json(
      { error: "你沒有權限修改課程" },
      { status: 403 }
    );
  }

   if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "課程名稱至少 3 個字" },
        { status: 400 }
      );
    }
    course.title = title.trim();
  }

  // Description
  if (description !== undefined) {
    if (typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json(
        { error: "課程描述至少 10 個字" },
        { status: 400 }
      );
    }
    course.description = description.trim();
  }

  // Price（注意：前端傳來一定是字串）
  if (price !== undefined) {
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { error: "價格需為大於 0 的數字" },
        { status: 400 }
      );
    }
    course.price = numericPrice;
  }

  // isPublished（布林值驗證）
  if (isPublished !== undefined) {
    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished 必須為布林值" },
        { status: 400 }
      );
    }
    course.isPublished = isPublished;
  }

  // 寫入資料庫
  await course.save();

  return NextResponse.json(
    { message: "課程已更新成功", course },
    { status: 200 }
  );
    
  
}





export const GET = withAuth(getHandler, { role: "instructor" });
export const PATCH = withAuth(patchHandler, { role: "instructor" });
