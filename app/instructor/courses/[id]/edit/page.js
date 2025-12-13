"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const { data } = await axios.get(`/api/courses/${params.id}`);
        const c = data.course;
        setTitle(c.title || "");
        setDescription(c.description || "");
        setPrice(c.price || "");
        setIsPublished(c.isPublished);
      } catch (err) {
        console.error("載入課程失敗", err);
        toast.error("無法載入課程資料");
      } finally {
        setFetching(false);
      }
    }
    fetchCourse();
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title !== undefined && title.trim().length < 3) {
      toast.error("課程標題至少 3 個字");
      return;
    }

    try {
      setLoading(true);
      await axios.patch(`/api/courses/${params.id}`, {
        title,
        description,
        price: Number(price),
        isPublished,
      });
      toast.success("課程更新成功");
      router.push(`/instructor/courses/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error("更新課程失敗", err);
      toast.error(err.response?.data?.error ?? "更新失敗");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <p className="text-center text-2xl text-gray-500 mt-10">載入中...</p>
    );
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">
        編輯課程:{title}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block font-medium">
            課程標題
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="description" className="block font-medium">
            課程描述
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="price" className="block font-medium">
            課程價格
          </label>
          <input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label htmlFor="published" className="block font-medium">
            課程狀態
          </label>
          <select
            id="published"
            value={isPublished ? "true" : "false"}
            onChange={(e) => setIsPublished(e.target.value === "true")}
            className="w-full border p-2 rounded"
          >
            <option value="false">未上架</option>
            <option value="true">已上架</option>
          </select>
        </div>

        <button
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "儲存中…" : "儲存變更"}
        </button>
      </form>
    </div>
  );
}
