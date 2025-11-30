import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import { connectDB } from "@/lib/db";

async function handler(req) {
  try {
    await connectDB();
    const { courseId, title, content, videoUrl } = await req.json();

    if (!courseId || !title) {
      return NextResponse.json({ error: "缺少必要欄位" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "課程不存在" }, { status: 404 });
    }

    if (course.instructor.toString() !== req.user.id) {
      return NextResponse.json({ error: "權限不足" }, { status: 403 });
    }

    const last = await Lesson.findOne({ course: courseId })
      .sort({ order: -1 })
      .lean();

    const finalOrder = last ? last.order + 1 : 1;

    const lesson = await Lesson.create({
      course: courseId,
      title,
      content,
      videoUrl,
      order: finalOrder,
    });

    return NextResponse.json(
      { message: "新增課程章節成功", lesson },
      { status: 201 }
    );
  } catch (err) {
    console.error("Lesson 新增失敗：", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export const POST = withAuth(handler);
