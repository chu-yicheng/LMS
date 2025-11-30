import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import { withAuth } from "@/lib/withAuth";

async function handler(req) {
  await connectDB();

  const courses = await Course.find({ instructor: req.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const result = await Promise.all(
    courses.map(async (c) => {
      const studentCount = await Enrollment.countDocuments({ course: c._id });
      return {
        id: c._id,
        title: c.title,
        price: c.price,
        description: c.description,
        isPublished: c.isPublished,
        studentCount,
        createdAt: c.createdAt,
      };
    })
  );
  return NextResponse.json({ courses: result }, { status: 200 });
}

export const GET = withAuth(handler, { role: "instructor" });
