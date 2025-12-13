import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { connectDB } from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";

async function handler(req) {
  try {
    await connectDB();

    // withAuth 已限制 role: student，這裡純保險
    if (req.user.role !== "student") {
      return NextResponse.json({ error: "僅學生存取" }, { status: 403 });
    }

    // 1️⃣ 取得學生基本資料（username 從 DB 來）
    const user = await User.findById(req.user.id)
      .select("username email")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
    }

    // 2️⃣ 取得學生已報名課程
    const enrollments = await Enrollment.find({
      user: req.user.id, // ← 保留你原本的欄位
    })
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "username email",
        },
      })
      .lean();

    return NextResponse.json(
      {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        enrollments,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "取得學生 Dashboard 失敗" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, { role: "student" });
