import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    originalPrice: { type: Number, min: 0 },

    discountRate: {
      type: Number,
      default: 0,
      min: [0, "折扣率不能小於 0"],
      max: [1, "折扣率不能大於 1"],
    },

    finalPrice: {
      type: Number,
      min: [0, "價格不能小於 0"],
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
        default: [],
      },
    ],
    completed: {
      type: Boolean,
      default: false,
    },
    paid: { type: Boolean, default: false },
    paymentId: String,
    paidAt: Date, // 💡 可選補充欄位
  },
  { timestamps: true }
);

// 防止重複報名
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// 自動計算 finalPrice

const Enrollment =
  mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
