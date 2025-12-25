/**
 * @deprecated
 * Use POST /api/student/courses/:id/progress instead.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import Course from "@/models/Course";

async function postHandler(req, { params }) {
  try {
    await connectDB();
    const lessonId = params.id;
    if (!lessonId) {
      return NextResponse.json({ error: "缺少章節 ID" }, { status: 400 });
    }
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "章節不存在" }, { status: 404 });
    }
    const course = await Course.findById(lesson.course);
    if (!course) {
      return NextResponse.json({ error: "課程不存在" }, { status: 404 });
    }
    if (req.user.role !== "student") {
      return NextResponse.json(
        { error: "僅學生可以標記完成" },
        { status: 403 }
      );
    }
    const enrollment = await Enrollment.findOne({
      course: course._id,
      user: req.user.id,
      paid: true,
    });
    if (!enrollment) {
      return NextResponse.json({ error: "尚未完成此註冊" }, { status: 404 });
    }
    if (!Array.isArray(enrollment.completedLessons)) {
      enrollment.completedLessons = [];
    }
    const alreadyCompleted = enrollment.completedLessons.some(
      (id) => String(id) === String(lessonId)
    );
    if (alreadyCompleted) {
      return NextResponse.json({ message: "章節已完成" }, { status: 200 });
    }
    enrollment.completedLessons.push(lesson._id);
    await enrollment.save();
    return NextResponse.json({ message: "章節標註完成" }, { status: 200 });
  } catch (err) {
    console.error("標記章節完成失敗:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export const POST = withAuth(postHandler);
