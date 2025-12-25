"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function EditLessonPage() {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const router = useRouter();
  const params = useParams(); // { id: 課程ID, lessonId: 章節ID }

  // 🟦 撈取章節內容
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const { data } = await axios.get(`/api/lessons/${params.lessonId}`);
        setTitle(data.lesson.title);
        setVideoUrl(data.lesson.videoUrl || "");
        setContent(data.lesson.content || "");
      } catch (err) {
        console.error("載入章節失敗", err);
        toast.error("無法載入章節內容");
      } finally {
        setFetching(false);
      }
    };
    fetchLesson();
  }, [params.lessonId]);

  // 🟧 提交更新
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("請輸入章節標題");
      return;
    }

    try {
      setLoading(true);
      await axios.patch(`/api/lessons/${params.lessonId}`, {
        title,
        videoUrl,
        content,
      });
      toast.success("章節更新成功");
      router.push(`/instructor/courses/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error("章節更新失敗", err);
      toast.error(err?.response?.data?.error ?? "更新章節失敗");
    } finally {
      setLoading(false);
    }
  };

  // 🕓 載入中畫面
  if (fetching)
    return (
      <p className="text-center text-2xl text-gray-500 mt-10">載入中...</p>
    );

  // 🧱 表單
  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="font-bold text-gray-700 mb-6 text-2xl">編輯章節</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 章節標題 */}
        <div>
          <label
            htmlFor="lessonTitle"
            className="block font-medium text-gray-700 mb-1 text-2xl"
          >
            章節標題：
          </label>
          <input
            id="lessonTitle"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="輸入章節標題"
            className="block font-medium w-full border border-gray-400 rounded p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-400"
            required
          />
        </div>

        {/* 章節內容 */}
        <div>
          <label
            htmlFor="lessonContent"
            className="block font-medium text-gray-700 text-2xl mb-1"
          >
            章節內容：
          </label>
          <textarea
            id="lessonContent"
            name="content"
            rows="6"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="輸入章節內容（可留空）"
            className="mt-2 block font-medium border border-gray-400 rounded-md w-full p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-400"
          />
        </div>

        {/* 影片連結 */}
        <div>
          <label
            htmlFor="lessonVideo"
            className="block font-medium text-gray-700 text-2xl mb-1"
          >
            影片連結（選填）：
          </label>
          <input
            id="lessonVideo"
            name="videoUrl"
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="例如 https://www.youtube.com/watch?v=xxx"
            className="mt-2 block font-medium border border-gray-400 rounded-md w-full p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-400"
          />
        </div>

        {/* 送出按鈕 */}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "儲存中..." : "更新章節"}
        </button>
      </form>
    </div>
  );
}
