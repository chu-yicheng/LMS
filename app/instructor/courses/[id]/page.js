import CourseDetailClient from "./CourseDetailClient";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }) {
  const res = await fetch(
    `/${NEXT_PUBLIC_APP_URL}/api/instructor/courses/${params.id}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    return <p className="text-center mt-10 text-red-600">無法取得課程資料</p>;
  }

  const data = res.json();

  return (
    <CourseDetailClient course={data.course} lessons={data.course.lessons} />
  );
}
