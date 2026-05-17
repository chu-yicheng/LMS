"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/api/auth/register", form);
      router.push("/login");
    } catch (err) {
      setError(err?.response?.data?.error || "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1 className="mb-6 text-3xl font-bold">註冊</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
        {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}

        <div>
          <label htmlFor="username" className="mb-1 block font-medium">使用者名稱</label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={updateField}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-medium">密碼</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-1 block font-medium">角色</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={updateField}
            className="w-full rounded border px-3 py-2"
          >
            <option value="student">學生</option>
            <option value="instructor">講師</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "註冊中..." : "建立帳號"}
        </button>
      </form>

      <p className="mt-4">
        已經有帳號？ <Link href="/login" className="text-indigo-600">前往登入</Link>
      </p>
    </main>
  );
}
