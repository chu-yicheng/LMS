"use client";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("請輸入標題");
      return;
    }
    try {
      setLoading(true);
      await axios.post("/api/courses/create", {
        title,
        description,
        price: Number(price),
      });
      toast.success("成功建立新課程");
      setTimeout(() => {
        router.push("/dashboard/courses");
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("建立課程失敗", err);
      toast.error(err?.response?.data?.error ?? "建立課程失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6">建立新課程</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block font-medium text-gray-600">
            課程標題
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded   "
            placeholder="請輸入課程名稱"
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block font-medium text-gray-600"
          >
            課程描述
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded   "
            placeholder="請輸入課程描述"
            required
          />
        </div>
        <div>
          <label htmlFor="price" className="block font-medium text-gray-600">
            課程價格
          </label>
          <input
            id="price"
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border px-3 py-2 rounded   "
            placeholder="請輸入課程價格"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? "送出中..." : "建立課程"}
        </button>
      </form>
    </main>
  );
}
