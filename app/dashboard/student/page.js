export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/student/dashboard`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <p className="text-red-700 text-3xl font-bold ">
          無法取得學生 Dashboard 資料
        </p>
      </div>
    );
  }
  const data = await res.json();
  const { user, enrollments } = data;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6">學生 Dashboard</h1>
      <p className="text-lg font-semibold text-gray-700">
        歡迎，{user.username}
      </p>
      <p className="text-lg font-semibold text-gray-600">{user.email}</p>
      <h2 className="text-2xl font-bold mb-4">我的課程</h2>
      {enrollments.length === 0 ? (
        <p className="text-gray-500">尚未報名任何課程</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {enrollments.map((l) => (
            <div key={l._id} className="border rounded-lg p-4 shadow bg-white">
              <h3 className="text-lg font-medium mb-1">{l.course.title}</h3>
              <p className="text-sm text-gray-600">
                {l.course.instructor?.username ?? "未知"}
              </p>
              <a
                href={`/courses/${l.course._id}`}
                className="inline-block mt-3 text-indigo-600 hover:underline"
              >
                進入課程
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
