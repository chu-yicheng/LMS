"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";

export default function CourseEnrollment() {
  const { id } = useParams();
  const [enrollments, setEnrollments] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // ⭐ 新增統計 state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [paymentRate, setPaymentRate] = useState(0);

  useEffect(() => {
    async function fetchCourseEnrollment() {
      try {
        const res = await axios.get(`/api/instructor/courses/${id}/enrollment`);
        const list = res.data.enrollments || [];

        setEnrollments(list);
        setCourseTitle(res.data.course.title || "");

        // ⭐ 計算已付款人數
        const paid = list.filter((e) => e.paid).length;
        setPaidCount(paid);

        // ⭐ 總人數
        const total = list.length;

        // ⭐ 計算付款率（百分比）
        const rate = total === 0 ? 0 : (paid / total) * 100;
        setPaymentRate(rate);

        // ⭐ 計算總收入
        const revenue = list
          .filter((e) => e.paid)
          .reduce((sum, e) => sum + (e.finalPrice || 0), 0);
        setTotalRevenue(revenue);
      } catch (err) {
        toast.error(err.response?.data?.error ?? "無法取得報名紀錄");
      } finally {
        setLoading(false);
      }
    }

    fetchCourseEnrollment();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-3xl font-bold">資料載入中</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <h1 className="text-3xl text-indigo-700 font-bold mb-6">
        {courseTitle} 的報名資料
      </h1>

      {/* ⭐ 統計卡片區塊 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-green-100 border border-green-300">
          <p className="font-semibold text-green-800 text-lg">總收入</p>
          <p className="text-xl font-bold text-green-700">
            NT$ {totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-blue-100 border border-blue-300">
          <p className="font-semibold text-blue-800 text-lg">已付款人數</p>
          <p className="text-xl font-bold text-blue-700">{paidCount} 人</p>
        </div>

        <div className="p-4 rounded-lg bg-purple-100 border border-purple-300">
          <p className="font-semibold text-purple-800 text-lg">付款率</p>
          <p className="text-xl font-bold text-purple-700">
            {paymentRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <p className="text-gray-600">目前沒有人報名</p>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => (
            <div
              key={e.enrollmentId}
              className="border rounded-lg p-4 shadow bg-white"
            >
              <p className="text-purple-600 text-xl">{e.student.username}</p>
              <p className="text-gray-600 text-sm">{e.student.email}</p>

              <div className="mt-2 text-sm text-gray-700">
                <p>報名日期：{new Date(e.enrolledAt).toLocaleString()}</p>
                <p>付款金額：NT$ {e.finalPrice}</p>
                <p>折扣比例：{e.discountRate ? e.discountRate * 100 : 0}%</p>

                <p>
                  付款狀態：
                  {e.paid ? (
                    <span className="text-green-600 font-semibold">已付款</span>
                  ) : (
                    <span className="text-red-600 font-semibold">未付款</span>
                  )}
                </p>

                {e.paymentId && <p>付款編號：{e.paymentId}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
