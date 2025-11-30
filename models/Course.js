import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "課程名稱必填"],
      minlength: [3, "課程標題至少 3 個字元"],
    },
    description: {
      type: String,
      required: [true, "課程介紹必填"],
      minlength: [10, "課程描述至少 10 個字元"],
    },
    price: { type: Number, min: 0, required: [true, "請輸入價格"] },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
