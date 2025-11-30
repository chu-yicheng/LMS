import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import Enrollment from "@/models/Enrollment";
import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

export default async function PublicCoursePage({ params }) {
  await connectDB();

  const courseId = params.id;

  // 取得課程
  const course = await Course.findById(courseId)
    .populate("instructor", "username email")
    .lean();

  if (!course) {
    return (
      <main className="max-w-5xl mx-auto mt-10 p-6">
        <p className="text-3xl font-bold">找不到此課程</p>
      </main>
    );
  }

  // 取得課程章節（照 order 排）
  const lessons = await Lesson.find({ course: courseId })
    .sort({ order: 1 })
    .lean();

  // ===== 購買判斷 =====
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;

  let userId = null;
  let isPurchased = false;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = decoded.id;

      const purchase = await Enrollment.findOne({
        user: userId,
        course: courseId,
        paid: true,
      }).lean();

      isPurchased = Boolean(purchase);
    } catch (err) {
      console.log("JWT 驗證失敗:", err);
    }
  }

  return (
    <main className="max-w-5xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold text-gray-700 mb-4">{course.title}</h1>

      <p className="text-2xl font-semibold text-gray-500 mb-4">
        {course.instructor?.username ?? "未知講師"}
      </p>

      {!isPurchased && (
        <p className="text-2xl font-semibold text-gray-700 mb-4">
          NT${course.price ?? 0}
        </p>
      )}

      {/* 課程介紹 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">課程介紹</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {course.description || "此課程尚無介紹內容"}
        </p>
      </section>

      {/* 課程章節 */}
      <section className="mb-10">
        {lessons.length === 0 ? (
          <p className="text-gray-600">目前還沒有任何課程。</p>
        ) : (
          <ul className="space-y-3">
            {lessons.map((l) => (
              <li
                className="border shadow rounded py-2 px-4 bg-gray-50 hover:border-yellow-400 transition"
                key={l._id}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{l.title}</span>

                  {!userId && (
                    <span className="text-gray-500">🔒 請先登入</span>
                  )}

                  {userId && !isPurchased && (
                    <span className="text-gray-500">🔒 需購買後觀看</span>
                  )}

                  {userId && isPurchased && (
                    <Link
                      href={`/learn/${courseId}/${l._id}`}
                      className="text-green-600 font-medium hover:underline"
                    >
                      ▶ 開始觀看
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 底部按鈕 */}
      <div className="mt-8">
        {!userId && (
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            請先登入
          </Link>
        )}

        {userId && !isPurchased && (
          <Link
            href={`/checkout/${course._id}`}
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition"
          >
            購買課程
          </Link>
        )}

        {userId && isPurchased && (
          <Link
            href={`/learn/${course._id}`}
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            開始上課
          </Link>
        )}
      </div>
    </main>
  );
}
