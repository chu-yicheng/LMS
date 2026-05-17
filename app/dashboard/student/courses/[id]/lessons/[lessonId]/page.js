import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Lesson from "@/models/Lesson";
import VideoPlayer from "@/components/VideoPlayer";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

function getCurrentUserId() {
  const token = cookies().get("accessToken")?.value;
  if (!token || !process.env.ACCESS_TOKEN_SECRET) return null;

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

export default async function StudentLessonPage({ params }) {
  await connectDB();

  const userId = getCurrentUserId();
  if (!userId) {
    return (
      <main className="container">
        <h1>請先登入</h1>
        <p>登入後才能觀看課程章節。</p>
        <Link href="/login">前往登入</Link>
      </main>
    );
  }

  const [course, lesson, lessons, enrollment] = await Promise.all([
    Course.findById(params.id).lean(),
    Lesson.findOne({ _id: params.lessonId, course: params.id }).lean(),
    Lesson.find({ course: params.id }).sort({ order: 1 }).lean(),
    Enrollment.findOne({ user: userId, course: params.id, paid: true }).lean(),
  ]);

  if (!course || !lesson) {
    notFound();
  }

  if (!enrollment) {
    return (
      <main className="container">
        <h1>尚未購買此課程</h1>
        <p>購買課程後即可觀看章節內容。</p>
        <Link href={`/courses/${params.id}`}>返回課程介紹頁</Link>
      </main>
    );
  }

  const completed = enrollment.completedLessons?.some(
    (completedLessonId) => String(completedLessonId) === String(lesson._id)
  );

  const currentIndex = lessons.findIndex(
    (item) => String(item._id) === String(lesson._id)
  );
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : null;

  return (
    <main className="container">
      <nav className="mb-6">
        <Link href={`/dashboard/student/courses/${params.id}`}>← 返回課程頁</Link>
      </nav>

      <section className="mb-8">
        <p className="text-gray-500 mb-2">{course.title}</p>
        <h1>{lesson.title}</h1>
        <p className="text-sm text-gray-500">
          完成狀態：{completed ? "已完成" : "未完成"}
        </p>
      </section>

      {lesson.videoUrl ? (
        <div className="mb-6">
          <VideoPlayer src={lesson.videoUrl} />
        </div>
      ) : (
        <p className="mb-6">此章節尚未提供影片。</p>
      )}

      <article className="rounded-lg bg-white p-4 shadow whitespace-pre-line leading-relaxed">
        {lesson.content || "此章節尚無內容。"}
      </article>

      <div className="mt-8 flex justify-between gap-4">
        {previousLesson ? (
          <Link href={`/dashboard/student/courses/${params.id}/lessons/${previousLesson._id}`}>
            ← 上一節
          </Link>
        ) : (
          <span />
        )}

        {nextLesson ? (
          <Link href={`/dashboard/student/courses/${params.id}/lessons/${nextLesson._id}`}>
            下一節 →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
