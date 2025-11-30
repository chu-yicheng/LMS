import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import User from "@/models/User";

// ----------------------------------------------------
// GET /api/enrollments
// 列出目前使用者的所有 enrollments
// ----------------------------------------------------
async function getHandler(req) {
  await connectDB();

  const userId = req.user.id;

  const list = await Enrollment.find({ user: userId })
    .populate("course", "title description price")
    .lean();

  return NextResponse.json(
    {
      success: true,
      enrollments: list,
    },
    { status: 200 }
  );
}

// ----------------------------------------------------
// POST /api/enrollments
// 建立「未付款的報名紀錄」(純 enrollment，不含付款)
// 用來先建立 enrollmentid → 之後 checkout 才能帶 metadata
// ----------------------------------------------------
async function postHandler(req) {
  await connectDB();

  const { courseId } = await req.json();

  if (!courseId) {
    return NextResponse.json({ error: "缺少 courseId" }, { status: 400 });
  }

  // 找學生
  const user = await User.findById(req.user.id);
  if (!user) {
    return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
  }
  if (user.isBanned) {
    return NextResponse.json({ error: "帳號已停權" }, { status: 403 });
  }
  if (user.role !== "student") {
    return NextResponse.json({ error: "只有學生可以選課" }, { status: 403 });
  }

  // 找課程
  const course = await Course.findById(courseId);
  if (!course) {
    return NextResponse.json({ error: "課程不存在" }, { status: 404 });
  }

  // 已買過 → 阻擋
  const existed = await Enrollment.findOne({
    user: user._id,
    course: courseId,
  });

  if (existed?.paid) {
    return NextResponse.json({ error: "你已經購買過此課程" }, { status: 409 });
  }

  // 若尚未建立 → 建立一筆未付款的 enrollment
  let enrollment = existed;

  if (!enrollment) {
    enrollment = await Enrollment.create({
      user: user._id,
      course: courseId,
      originalPrice: course.price,
      discountRate: 0,
      finalPrice: course.price, // 還沒有使用折扣
      paid: false,
      coupon: null,
    });
  }

  return NextResponse.json(
    {
      success: true,
      message: "未付款報名紀錄已建立",
      enrollment,
    },
    { status: 200 }
  );
}

export const GET = withAuth(getHandler, { role: "student" });
export const POST = withAuth(postHandler, { role: "student" });
