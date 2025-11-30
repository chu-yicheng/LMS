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
  const studentCount = await Enrollment.countDocuments({ course: courseId });

  // 3) 回傳格式
  return NextResponse.json(
    {
      message: "取得課程成功",
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
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
  const { title, price, description } = await req.json();
  const courseId = params.id;
  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }
  if (course.instructor.toString() !== req.user.id) {
    return NextResponse.json(
      { error: "你沒有權限修改此課程" },
      { status: 403 }
    );
  }
  const updates = {};
  if (title) {
    if (title.trim().length < 3) {
      return NextResponse.json(
        { error: "課程標題至少 3 個字元" },
        { status: 400 }
      );
    }
    updates.title = title.trim();
  }

  if (description) {
    if (description.trim().length < 10) {
      return NextResponse.json(
        { error: "課程描述至少 10 個字元" },
        { status: 400 }
      );
    }
    updates.description = description.trim();
  }
  if (price !== undefined) {
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "價格格式錯誤" }, { status: 400 });
    }
    updates.price = price;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新資料" }, { status: 400 });
  }
  const updatedCourse = await Course.findByIdAndUpdate(courseId, updates, {
    new: true,
  })
    .select("title description price")
    .lean();

  return NextResponse.json(
    { message: "更新成功", course: updatedCourse },
    { status: 200 }
  );
}

export const DELETE = withAuth(deleteHandler, { role: "instructor" });
export const PATCH = withAuth(patchHandler, { role: "instructor" });
