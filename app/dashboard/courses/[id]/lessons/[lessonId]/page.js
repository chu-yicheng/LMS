"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LessonDetailPage() {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const { data } = await axios.get(`/api/lessons/${params.lessonId}`);
        setLesson(data.lesson);
      } catch (err) {
        console.error("載入章節失敗:", err);
        toast.error("無法載入章節內容");
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [params.lessonId]);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">載入中...</p>;

  if (!lesson)
    return (
      <p className="text-center mt-10 text-red-500">找不到章節或發生錯誤。</p>
    );

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <div>
        <h1 className="font-bold text-gray-700 mb-6 text-2xl">
          {lesson.title}
        </h1>
        <Link
          href={`/dashboard/courses/${params.id}`}
          className="text-blue-600 hover:underline mb-6"
        >
          ← 返回課程
        </Link>
      </div>

      {lesson.videoUrl ? (
        <div className="mb-6">
          <iframe
            src={lesson.videoUrl.replace("watch?v=", "embed/")}
            className="w-full aspect-video rounded-md border"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <p>此章節沒有影片</p>
      )}
      {/* 內容區 */}
      {lesson.content ? (
        <div className="prose prose-indigo max-w-none text-gray-800 leading-relaxed">
          {lesson.content}
        </div>
      ) : (
        <p className="text-gray-500">此章節暫無內容。</p>
      )}
    </div>
  );
}