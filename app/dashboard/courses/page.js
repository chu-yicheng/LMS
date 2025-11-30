import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  await connectDB();
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .populate("instructor", "username")
    .lean();

  if (!courses.length) {
    return (
      <main className="max-w-2xl mx-auto mt-20 text-center text-gray-700">
        <p>目前沒有課程</p>
        <Link
          href="/dashboard/courses/new"
          className="inline-block mt-3 text-blue-600 hover:underline"
        >
          ➕ 建立新課程
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 mt-10">
      <h1 className="text-3xl text-gray-700 font-bold mb-6">課程表單:</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div
            key={course._id}
            className="border rounded-lg shadow p-4 bg-white hover:border-yellow-400  transition"
          >
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
              <Link href={`/dashboard/courses/${course._id}`}>
                {course.title}
              </Link>
            </h2>
            <p className="text-xl text-gray-600 font-medium mb-4 line-clamp-2">
              {course.description || "（無課程簡介）"}
            </p>
            <p className="text-xl text-gray-400 font-medium mb-4">
              講師:{course.instructor?.username || "未知"}
            </p>
            <p className="text-xl text-gray-600 font-medium mb-4">
              NT${course.price ?? 0}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
