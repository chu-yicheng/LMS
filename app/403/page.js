import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="container">
      <h1>權限不足</h1>
      <p>你沒有權限瀏覽此頁面。</p>
      <Link href="/">返回首頁</Link>
    </main>
  );
}
