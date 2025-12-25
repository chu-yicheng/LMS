"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";

export default function CourseStudentsPage() {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await axios.get(`/api/courses/${id}/students`);
        setStudents(res.data.students || []);
        setCourseTitle(res.data.courseTitle || "");
      } catch (err) {
        toast.error(err.response?.data?.error ?? "取得學生資料失敗");
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
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
        {courseTitle}的學生名單
      </h1>
      {students.length === 0 ? (
        <p className="text-gray-600">目前沒有學生註冊</p>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <div key={s._id} className="border rounded-lg p-4 shadow bg-white">
              <p className="text-purple-600 text-xl">{s.username}</p>
              <p className="text-gray-600 text-sm">{s.email}</p>
              <p className="text-gray-600 text-sm">
                報名日期：{new Date(s.enrolledAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
