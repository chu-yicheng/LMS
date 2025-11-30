import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: { type: String, required: true },
    content: {
      type: String, // 可改 markdown / HTML
    },
    order: {
      type: Number, // 章節順序
      default: 1,
    },
    videoUrl: {
      type: String, // 可選
    },
  },
  { timestamps: true }
);
const Lesson = mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);

export default Lesson;
