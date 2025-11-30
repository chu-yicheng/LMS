import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function GET() {
  await connectDB();

  // 1) 找所有公開課程
  const courses = await Course.find({ isPublished: true })
    .populate("instructor", "username email")
    .sort({ createdAt: -1 })
    .lean();
  const result = await Promise.all(
    courses.map(async (c) => {
      const studentCount = await Enrollment.countDocuments({ course: c._id });

      return {
        id: c._id,
        title: c.title,
        price: c.price,
        instructor: c.instructor?.username,
        studentCount,
        createdAt: c.createdAt,
      };
    })
  );

  return NextResponse.json(
    {
      message: "取得課程列表成功",
      courses: result,
    },
    { status: 200 }
  );
}
