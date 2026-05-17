"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard/student";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/api/auth/login", { email, password });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err?.response?.data?.error || "登入失敗，請確認帳號密碼");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1 className="mb-6 text-3xl font-bold">登入</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg bg-white p-6 shadow">
        {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}

        <div>
          <label htmlFor="email" className="mb-1 block font-medium">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-medium">密碼</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "登入中..." : "登入"}
        </button>
      </form>

      <p className="mt-4">
        還沒有帳號？ <Link href="/register" className="text-indigo-600">前往註冊</Link>
      </p>
    </main>
  );
}
