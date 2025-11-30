import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";

async function handler(req, { params }) {
  try {
    await connectDB();
    const courseId = params.id;
    if (!courseId) {
      return NextResponse.json({ error: "缺少課程 ID" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "課程不存在" }, { status: 400 });
    }
    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1 })
      .lean();
    return NextResponse.json(
      { message: "取得章節成功", count: lessons.length, lessons },
      { status: 200 }
    );
  } catch (err) {
    console.error("取得課程章節失敗:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export const GET = withAuth(handler);
