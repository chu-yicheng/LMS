import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import { withAuth } from "@/lib/withAuth";
import Enrollment from "@/models/Enrollment";

export async function GET(_req, { params }) {
  await connectDB();

  const courseId = params.id;

  // 1) 找課程
  const course = await Course.findById(courseId)
    .populate("instructor", "username email")
    .lean();

  // 2) 找不到 → 404
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }
  const lessons = await Lesson.find({ course: courseId })
    .sort({ order: 1 })
    .lean();
  const studentCount = await Enrollment.countDocuments({
    course: courseId,
    paid: true,
  });

  // 3) 回傳格式
  return NextResponse.json(
    {
      message: "取得課程成功",
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        isPublished: course.isPublished,
        instructor: {
          name: course.instructor.username,
          email: course.instructor.email,
        },
        studentCount,
        createdAt: course.createdAt,
        lessons,
      },
    },
    { status: 200 }
  );
}

async function deleteHandler(req, { params }) {
  await connectDB();
  const courseId = params.id;
  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }
  if (course.instructor.toString() !== req.user.id) {
    return NextResponse.json(
      { error: "你沒有權限刪除此課程" },
      { status: 403 }
    );
  }
  await Course.findByIdAndDelete(courseId);

  return NextResponse.json({ message: "課程已刪除" }, { status: 200 });
}

async function patchHandler(req, { params }) {
  await connectDB();
  const courseId = params.id;

  // 安全取得 body
  let body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "請提供正確的 JSON 格式" },
      { status: 400 }
    );
  }

  const { title, description, price, isPublished } = body;

  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  // 講師身分驗證
  if (String(course.instructor) !== req.user.id) {
    return NextResponse.json(
      { error: "權限不足，僅講師可修改課程" },
      { status: 403 }
    );
  }

  // ===== 驗證與更新 =====
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { error: "課程標題至少 3 個字" },
        { status: 400 }
      );
    }
    course.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string" || description.trim().length < 10) {
      return NextResponse.json(
        { error: "課程描述至少 10 個字" },
        { status: 400 }
      );
    }
    course.description = description.trim();
  }

  if (price !== undefined) {
    const numeric = Number(price);
    if (isNaN(numeric) || numeric < 0) {
      return NextResponse.json(
        { error: "價格需為大於 0 的數字" },
        { status: 400 }
      );
    }
    course.price = numeric;
  }

  if (isPublished !== undefined) {
    if (typeof isPublished !== "boolean") {
      return NextResponse.json(
        { error: "isPublished 必須為布林值" },
        { status: 400 }
      );
    }
    course.isPublished = isPublished;
  }

  await course.save();

  return NextResponse.json(
    { message: "課程更新成功", course },
    { status: 200 }
  );
}
export const DELETE = withAuth(deleteHandler, { role: "instructor" });
export const PATCH = withAuth(patchHandler, { role: "instructor" });
