"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function NewLessonPage() {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("請輸入章節標題");
      return;
    }
    try {
      setLoading(true);
      await axios.post("/api/lessons", {
        courseId: params.id,
        title,
        videoUrl,
        content,
      });
      toast.success("章節建立成功");
      router.push(`/dashboard/courses/${params.id}`);
    } catch (err) {
      console.error("新章節創立失敗", err);
      toast.error(err.response?.data?.error ?? "章節建立失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-gray-700 text-2xl font-bold mb-6">新增章節</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="lessonTitle"
            className="block font-medium text-gray-700 text-2xl mb-1"
          >
            章節標題:
          </label>
          <input
            id="lessonTitle"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="輸入章節標題"
            className="mt-2 block font-medium  border border-gray-400 rounded w-full p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-400"
            required
          />
        </div>
        <div>
          <label
            htmlFor="lessonContent"
            className="block font-medium text-gray-700 text-2xl mb-1"
          >
            章節內容:
          </label>
          <textarea
            id="lessonContent"
            name="content"
            rows="4"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="輸入章節內容(可留空)"
            className="mt-2 block font-medium  border border-gray-400 rounded w-full p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-400"
          />
        </div>
        <div>
          <label
            htmlFor="lessonVideo"
            className="block font-medium text-gray-700 text-2xl mb-1"
          >
            影片連接(選填)
          </label>
          <input
            id="lessonVideo"
            name="videoUrl"
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="例如 https://www.youtube.com/watch?v=xxx"
            className="mt-2 block font-medium  border border-gray-400 rounded w-full p-2 focus:ring focus:ring-indigo-200 focus:border-indigo-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "送出中..." : "建立章節"}
        </button>
      </form>
    </div>
  );
}
