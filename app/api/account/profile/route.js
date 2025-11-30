import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { withAuth } from "@/lib/withAuth";

async function getHandler(req) {
  await connectDB();
  const user = await User.findById(req.user.id).select("-password").lean();

  if (!user) {
    return NextResponse.json({ error: "使用者不存在" }, { status: 404 });
  }
  return NextResponse.json({ message: "取得資料成功" }, user);
}

async function patchHandler(req) {
  await connectDB();
  const { username, email } = await req.json();
  const updates = {};
  if (username.trim().length < 3) {
    return NextResponse.json({ error: "使用者名稱至少3個字" }, { status: 401 });
  }
  updates.username = username.trim();
  if (email) {
    const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!basicEmailPattern.test(email)) {
      return NextResponse.json({ error: "Email格式不對" }, { status: 400 });
    }
  }
  //不要擋到自己，只擋別人的 email
  const exists = await User.findOne({ email,_id:{$ne:req.user.id}});
  if (exists) {
    return NextResponse.json({ error: "Email已經被使用了" }, { status: 409 });
  }
  updates.email = email.toLowCase();
  if(Object.keys(updates).length===0){return NextResponse.json({error:"沒有更新資料"},{status:400})}

  const updatedUser=await User.findByIdAndUpdate(req.user.id,updates,
    { new: true }).select("-password").lean()

  return NextResponse.json( { message: "更新成功", user: updatedUser },
    { status: 200 })
}

export const GET = withAuth(getHandler);
export const Patch=withAuth(patchHandler)
