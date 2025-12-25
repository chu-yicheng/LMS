import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Course from "@/model/Course";
import Enrollment from "@/model/Enrollment";
import Lesson from "@/model/Lesson";

async function getHandler(req, { params }) {
  try {
    await connectDB();
    const courseId = params.id;

    if (!courseId) {
      return NextResponse.json({ error: "缺少課程 id" }, { status: 400 });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return NextResponse.json({ error: "找不到課程" }, { status: 404 });
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      user: req.user.id,
      paid: true,
    });

    if (!enrollment) {
      return NextResponse.json({ error: "尚未註冊此課程" }, { status: 403 });
    }

    const lessons = await Lesson.find({ course: courseId })
      .sort({ order: 1 })
      .select("title order")
      .lean();

    const completedLessons = enrollment.completedLessons || [];

    const progress = lessons.map((l) => ({
      id: l._id,
      title: l.title,
      order: l.order,
      completed: completedLessons.some(
        (completedId) => String(completedId) === String(l._id)
      ),
    }));

    return NextResponse.json(
      { courseTitle: course.title, progress },
      { status: 200 }
    );
  } catch (err) {
    console.error("取得課程進度失敗:", err);
    return NextResponse.json(
      { error: "無法取得課程進度，請稍後再試" },
      { status: 500 }
    );
  }
}

async function postHandler(req, { params }) {
  try {
    await connectDB();

    const courseId = params.id;
    const { lessonId } = await req.json();

    if (!courseId || !lessonId) {
      return NextResponse.json({ error: "缺少課程或章節 ID" }, { status: 400 });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return NextResponse.json({ error: "找不到課程" }, { status: 404 });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return NextResponse.json(
        { error: "找不到此課程的章節" },
        { status: 404 }
      );
    }

    const enrollment = await Enrollment.findOne({
      course: courseId,
      user: req.user.id,
      paid: true,
    });

    if (!enrollment) {
      return NextResponse.json({ error: "尚未註冊此課程" }, { status: 403 });
    }

    const alreadyCompleted = enrollment.completedLessons.some(
      (id) => String(id) === String(lessonId)
    );

    if (!alreadyCompleted) {
      enrollment.completedLessons.push(lessonId);
    }

    const totalLessons = await Lesson.countDocuments({ course: courseId });
    const uniqueCompletedCount = new Set(
      enrollment.completedLessons.map((id) => id.toString())
    ).size;

    if (uniqueCompletedCount >= totalLessons) {
      enrollment.completed = true;
    }

    await enrollment.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("標記完成失敗:", err);
    return NextResponse.json({ error: "無法更新進度" }, { status: 500 });
  }
}

export const GET = withAuth(getHandler, { role: "student" });
export const POST = withAuth(postHandler, { role: "student" });
