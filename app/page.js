import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container">
      <h1>LMS 平台</h1>
      <p>此專案已升級為 Next.js App Router 架構，正在進行 production 就緒化。</p>
      <div className="actions">
        <Link href="/courses">前往課程列表</Link>
        <Link href="/dashboard/student">學生儀表板</Link>
      </div>
    </main>
  );
}
