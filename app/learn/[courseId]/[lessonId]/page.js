import { connectDB } from "@/lib/db";
import { cookies } from "next/headers";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Enrollment from "@/models/Enrollment";
import jwt from "jsonwebtoken";
import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";

export const dynamic = "force-dynamic";

export default async function LearnPage({ params }) {
  await connectDB();
  const { courseId, lessonId } = params;

  // -----------------------------
  // 1) 找課程
  // -----------------------------
  const course = await Course.findById(courseId).lean();
  if (!course) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-3xl text-red-600 font-bold">找不到此課程</p>
      </main>
    );
  }

  // -----------------------------
  // 2) 找所有章節
  // -----------------------------
  const lessons = await Lesson.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  // -----------------------------
  // 3) 找目前章節
  // -----------------------------
  const currentLesson = lessons.find((l) => String(l._id) === lessonId);

  if (!currentLesson) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-3xl text-red-600 font-bold">找不到此章節</p>
      </main>
    );
  }

  // -----------------------------
  // 4) JWT Token 驗證
  // -----------------------------
  const token = cookies().get("accessToken")?.value;

  let userId = null;
  let isPurchased = false;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = decoded.id;

      // ❗❗只有 paid:true 才算購買成功
      const enrollment = await Enrollment.findOne({
        user: userId,
        course: courseId,
        paid: true,
      }).lean();

      isPurchased = Boolean(enrollment);
    } catch (err) {
      console.log("JWT 驗證失敗:", err);
    }
  }

  // -----------------------------
  // 5) 若尚未購買 → 擋住
  // -----------------------------
  if (!userId || !isPurchased) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-gray-700 mb-4">你尚未購買此課程</h2>
          <Link
            href={`/courses/${courseId}`}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            回到課程介紹頁
          </Link>
        </div>
      </main>
    );
  }

  // -----------------------------
  // 6) 找上一節 / 下一節
  // -----------------------------
  const currentIndex = lessons.findIndex((l) => String(l._id) === lessonId);
  const prevLesson = lessons[currentIndex - 1] || null;
  const nextLesson = lessons[currentIndex + 1] || null;

  // -----------------------------
  // 7) 主畫面
  // -----------------------------
  return (
    <div className="flex max-w-5xl mx-auto mt-10 p-6">
      {/* 左側章節列表 */}
      <aside className="w-64 border-r pr-4">
        <h2 className="text-2xl font-bold mb-4">課程章節</h2>
        <ul className="space-y-3">
          {lessons.map((l) => {
            const active = String(l._id) === lessonId;

            return (
              <li key={l._id}>
                <Link
                  href={`/learn/${courseId}/${l._id}`}
                  className={`block p-2 rounded ${
                    active ? "bg-indigo-600 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {l.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* 右側內容 */}
      <main className="flex-1">
        <h1 className="font-bold text-3xl text-gray-700 mb-6">
          {currentLesson.title}
        </h1>
        {currentLesson.videoUrl && (
          <div className="mb-6">
            <VideoPlayer src={currentLesson.videoUrl} />
          </div>
        )}

        <div className="bg-white p-4 shadow rounded-lg leading-relaxed whitespace-pre-line">
          {currentLesson.content || "此章節尚無內容。"}
        </div>

        {/* 上一節 / 下一節 */}
        <div className="flex justify-between mt-8">
          {prevLesson ? (
            <Link
              href={`/learn/${courseId}/${prevLesson._id}`}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              ← 上一節
            </Link>
          ) : (
            <div />
          )}

          {nextLesson ? (
            <Link
              href={`/learn/${courseId}/${nextLesson._id}`}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              下一節 →
            </Link>
          ) : (
            <div />
          )}
        </div>
      </main>
    </div>
  );
}
