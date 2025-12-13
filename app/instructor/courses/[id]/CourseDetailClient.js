"use client";
import { useState } from "react";
import axios from "axios";

import Link from "next/link";
import toast from "react-hot-toast";

export default function CourseDetailClient({ course, lessons }) {
  const [lessonList, setLessonList] = useState(lessons || []);

  const handleDelete = async (lessonId) => {
    try {
      await axios.delete(`/api/lessons/${lessonId}`);
      toast.success("章節已刪除");
      setLessonList((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (err) {
      console.error("刪除章節失敗：", err);
      toast.error(err.response?.data?.error || "刪除章節失敗");
    }
  };

  if (!course?.title) {
    return <p className="text-center mt-10 text-gray-500">載入中...</p>;
  }

  return (
    <main className="max-w-4xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-2 ">{course.title}</h1>
      <p className="mb-6 text-gray-500">{course.description}</p>
      <div className="gap-3 mb-6 text-gray-700">
        <p>學生人數：{course.studentCount}</p>
        <p>總收入：NT$ {course.totalRevenue?.toLocaleString()}</p>
      </div>

      <div className=" mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">章節列表</h2>
        <Link
          href={`/instructor/courses/${course.id}/lessons/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + 新增章節
        </Link>
      </div>
      {lessonList.length === 0 ? (
        <p className="text-gray-500">目前沒有章節</p>
      ) : (
        <ul className="space-y-3">
          {lessonList.map((lesson) => (
            <li
              key={lesson.id}
              className="flex justify-between items-center border p-3 rounded"
            >
              <div>
                <span className="font-medium">
                  {lesson.order}. {lesson.title}
                </span>
              </div>
              <div className="space-x-3">
                <Link
                  href={`/instructor/courses/${course.id}/lessons/${lesson.id}/edit`}
                  className="text-blue-600 hover:underline"
                >
                  編輯
                </Link>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="text-red-500 hover:underline"
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
