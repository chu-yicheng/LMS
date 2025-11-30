import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withAuth } from "@/lib/withAuth";
import Course from "@/models/Course";

async function handler(req) {
  await connectDB();

  const { title, description, price } = await req.json();

  // 1) 驗證欄位
  if (!title || !description || price == null) {
    return NextResponse.json(
      { error: "請完整填寫課程名稱、介紹與價格" },
      { status: 400 }
    );
  }
  const priceNum = Number(price);
  if (isNaN(priceNum) || priceNum < 0) {
    return NextResponse.json(
      { error: "價格必須是有效的非負數" },
      { status: 400 }
    );
  }

  try {
    const course = await Course.create({
      title,
      description,
      price: priceNum,
      instructor: req.user.id, // 🔒 綁定講師身份
    });

    // ✅ 回傳成功
    return NextResponse.json(
      {
        message: "課程建立成功",
        course: {
          id: course._id,
          title: course.title,
          description: course.description,
          price: course.price,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("建立課程失敗：", err);
    return NextResponse.json(
      { error: "伺服器錯誤，無法建立課程" },
      { status: 500 }
    );
  }
}

// ✅ 限 Instructor 使用此 API
export const POST = withAuth(handler, { role: "instructor" });
