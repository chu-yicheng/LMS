import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicCoursesPage() {
  await connectDB();
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .populate("instructor", "username")
    .lean();
  return (
    <main className="max-w-5xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold text-gray-700 mb-6">課程表列:</h1>
      {courses.length === 0 ? (
        <p className="text-gray-600">目前還沒有任何課程。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {courses.map((c) => (
            <Link
              href={`/courses/${c._id}`}
              className="border shadow rounded py-2 px-4 bg-white hover:border-yellow-400 transition"
              key={c._id}
            >
              <h2 className="text-2xl font-semibold text-indigo-700 mb-2">
                {c.title}
              </h2>
              <p className=" text-gray-700 line-clamp-2 mb-2">
                {c.description || "無課程介紹"}
              </p>
              <p className="text-gray-500 mb-2">
                {c.instructor?.username ?? "未知"}
              </p>
              <p className="text-gray-700">NT${c.price ?? 0}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
