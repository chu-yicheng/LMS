"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function StudentCoursePage() {
  const params = useParams();

  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!params?.id) return;

    const fetchProgress = async () => {
      try {
        const { data } = await axios.get(
          `/api/student/courses/${params.id}/progress`
        );
        setTitle(data.courseTitle);
        setProgress(data.progress);
      } catch (err) {
        console.error("載入課程進度失敗:", err);
        toast.error("無法取得課程資料");
      } finally {
        setFetching(false);
      }
    };

    fetchProgress();
  }, [params?.id]);

  /* ---------- loading ---------- */
  if (fetching) {
    return (
      <div className="min-h-screen mt-10 p-6 flex justify-center">
        <p className="text-3xl font-bold">載入中...</p>
      </div>
    );
  }

  /* ---------- progress calc ---------- */
  const completedCount = progress.filter((l) => l.completed).length;
  const percent =
    progress.length === 0
      ? 0
      : Math.round((completedCount / progress.length) * 100);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      {/* 標題 */}
      <h1 className="text-3xl font-bold text-indigo-700 mb-2">
        {title} 的課程進度
      </h1>

      <p className="text-gray-600 mb-6">
        完成進度：{completedCount} / {progress.length}（{percent}%）
      </p>

      {/* 章節列表 */}
      {progress.length === 0 ? (
        <p className="text-gray-500">此課程尚未建立任何章節</p>
      ) : (
        <ul className="space-y-4">
          {progress.map((l) => (
            <li key={l.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <p className="font-semibold text-gray-800">
                第 {l.order} 課：{l.title}
              </p>

              <p
                className={`text-sm ${
                  l.completed ? "text-green-600" : "text-gray-400"
                }`}
              >
                {l.completed ? "已完成" : "未完成"}
              </p>

              <Link
                href={`/dashboard/student/courses/${params.id}/lessons/${l.id}`}
                className="inline-block mt-2 text-indigo-600 hover:underline"
              >
                前往學習 →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
