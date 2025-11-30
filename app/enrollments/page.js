"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyEnrollmentPage() {
  const router = useRouter();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const res = await fetch("/api/enrollments");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "無法取得課程列表");
        } else {
          setList(data.enrollments);
        }
      } catch (err) {
        setError("取得課程列表時發生錯誤");
      } finally {
        setLoading(false);
      }
    }
    fetchEnrollments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-3xl">載入課程中...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-600">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded text-xl bg-gray-700 text-white "
        >
          回首頁
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">我的課程</h1>
      {list.length === 0 ? (
        <p className="text-gray-600">你目前沒有購買任何課程</p>
      ) : (
        <div className="space-y-4">
          {list.map((c) => (
            <div
              key={c._id}
              className="border p-4 rounded hover:bg-gray-500 cursor-pointer"
              onClick={() => router.push(`/dashboard/courses/${c.course._id}`)}
            >
              <h2 className="text-xl font-semibold">{c.course.title}</h2>
              <p className="text-gray-700 mt-1">價格：{c.finalPrice} 元</p>
              <p
                className={`mt-1 font-semibold ${
                  item.paid ? "text-green-600" : "text-red-600"
                }`}
              >
                {c.paid ? "已付款" : "尚未付款"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
