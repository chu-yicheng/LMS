import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Lesson from "@/models/Lesson";
import Course from "@/models/Course";

async function handler(req, { params }) {
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
    return NextResponse.json(
      {
        message: "取得章節成功",
        lesson,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("取得章節失敗:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

async function putHandler(req, { params }) {
  try {
    await connectDB();
    const lessonId = params.id;
    if (!lessonId) {
      return NextResponse.json({ error: "缺少章節 ID" }, { status: 400 });
    }
    const { title, content, videoUrl, order } = await req.json();
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "章節不存在" }, { status: 404 });
    }
    const course = await Course.findById(lesson.course);
    if (!course) {
      return NextResponse.json({ error: "課程不存在" }, { status: 404 });
    }
    if (course.instructor.toString() !== req.user.id) {
      return NextResponse.json(
        { error: "權限不足，僅講師可修改章節" },
        { status: 403 }
      );
    }
    if (title !== undefined) lesson.title = title;
    if (content !== undefined) lesson.content = content;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (order !== undefined) lesson.order = order;
    await lesson.save();

    return NextResponse.json(
      { message: "章節更新成功", lesson },
      { status: 200 }
    );
  } catch (err) {
    console.error("更新章節失敗:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
async function deleteHandler(req, { params }) {
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

    if (course.instructor.toString() !== req.user.id) {
      return NextResponse.json(
        { error: "權限不足，僅講師可刪除章節" },
        { status: 403 }
      );
    }
    await lesson.deleteOne();

    // （可選）重新排序該課章節的 order
    const lessons = await Lesson.find({ course: course._id }).sort({
      order: 1,
    });
    for (let i = 0; i < lessons.length; i++) {
      lessons[i].order = i + 1;
      await lessons[i].save();
    }

    return NextResponse.json(
      { message: "章節已刪除並重新排序", deletedId: lessonId },
      { status: 200 }
    );
  } catch (err) {
    console.error("刪除章節失敗:", err);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

export const GET = handler;
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
