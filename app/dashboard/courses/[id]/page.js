import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Lesson from "@/models/Lesson";
import CourseDetailClient from "./CourseDetailClient";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }) {
  await connectDB();
  const course = await Course.findById(params.id)
    .popluate("instructor", "username")
    .lean();
  const lessons = await Lesson.find({ course: params.id })
    .sort({ order: 1 })
    .lean();

  return <CourseDetailClient course={course} lessons={lessons} />;
}
