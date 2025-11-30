"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setError("無法取得付款資訊（缺少 session_id）");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/payments/verify?session_id=${sessionId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "付款驗證失敗");
        } else {
          setPaid(data.paid || false);
          setCourseTitle(data.enrollment?.courseTitle ?? "");
        }
      } catch (err) {
        setError("付款驗證時發生錯誤，請聯絡客服");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-2xl">正在確認付款狀態....</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3">
        <h1 className="text-2xl text-red-700 font-bold">付款異常</h1>
        <p className="text-lg">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded bg-gray-800 text-white"
        >
          回首頁
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold text-green-700">付款成功</h1>

      {courseTitle && (
        <p className="text-md text-gray-700">
          購買課程：<span className="font-semibold">{courseTitle}</span>
        </p>
      )}

      <p className="text-lg">您的課程已經成功開通。</p>

      <button
        onClick={() => router.push("/enrollments")}
        className="py-2 px-4 rounded text-white bg-green-600 hover:bg-green-700"
      >
        前往課程
      </button>
    </div>
  );
}
