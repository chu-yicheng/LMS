"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ----------------------------
  // GET 使用者資料
  // ----------------------------
  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await axios.get("/api/account");

        if (!res.data.user) {
          toast.error("無法取得使用者資料");
          return;
        }

        setUsername(res.data.user.username || "");
        setEmail(res.data.user.email || "");
      } catch (err) {
        toast.error(err.response?.data?.error || "伺服器錯誤");
      } finally {
        setLoading(false);
      }
    }

    fetchAccount();
  }, []);

  // ----------------------------
  // PATCH 基本資料
  // ----------------------------
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.patch("/api/account", { username, email });
      toast.success("基本資料更新成功！");
    } catch (err) {
      toast.error(err.response?.data?.error || "更新失敗");
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------
  // PATCH 修改密碼
  // ----------------------------
  async function handleChangePassword(e) {
    e.preventDefault();
    setChangingPassword(true);

    try {
      await axios.patch("/api/account/change-password", {
        oldPassword,
        newPassword,
        confirmPassword,
      });

      toast.success("密碼修改成功！");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.error || "更新失敗");
    } finally {
      setChangingPassword(false);
    }
  }

  // ----------------------------
  // 載入畫面
  // ----------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-3xl font-bold">載入資料中...</p>
      </div>
    );
  }

  // ----------------------------
  // 主畫面
  // ----------------------------
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">帳號設定</h1>

      {/* 基本資料 */}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block font-medium text-gray-600 mb-1">
            使用者名稱
          </label>
          <input
            type="text"
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-gray-600 mb-1">
            使用者 Email
          </label>
          <input
            type="email"
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {saving ? "儲存中..." : "儲存設定"}
        </button>
      </form>

      {/* 修改密碼 */}
      <h1 className="text-3xl font-bold text-indigo-700 mb-6 mt-10">
        修改密碼
      </h1>

      <form onSubmit={handleChangePassword} className="space-y-6">
        <div>
          <label className="block font-medium text-gray-600 mb-1">舊密碼</label>
          <input
            type="password"
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-300"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-gray-600 mb-1">新密碼</label>
          <input
            type="password"
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-300"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium text-gray-600 mb-1">
            確認新密碼
          </label>
          <input
            type="password"
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:ring-indigo-300"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="w-full py-3 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition disabled:opacity-50"
        >
          {changingPassword ? "變更中..." : "更新密碼"}
        </button>
      </form>
    </div>
  );
}
