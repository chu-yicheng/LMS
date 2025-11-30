import mongoose from "mongoose";
import bcrypt from "bcrypt";

const emailValidator = function (v) {
  const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicEmailPattern.test(v)) {
    return false;
  }
  const allSameCharPattern = /^(\w)\1+$/;
  if (allSameCharPattern.test(v)) {
    return false;
  }
  return true;
};

const passwordStrengthValidator = function (v) {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return pattern.test(v);
};

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      minlength: [3, "使用者名稱至少 3 個字元"],
      maxlength: [30, "使用者名稱最多 30 個字元"],
      required: [true, "使用者名稱必填"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email 必填"],
      unique: true,
      lowercase: true,
      validate: {
        validator: emailValidator,
        message: (props) =>
          `${props.value} 不是有效的 Email 格式或格式重複無效`,
      },
    },
    password: {
      type: String,
      minlength: [8, "密碼至少 8 個字元"],
      required: [true, "密碼必填"],
      validate: {
        validator: passwordStrengthValidator,
        message: () =>
          "密碼強度不足，必須包含大寫、小寫字母與數字，且長度至少 8 字元",
      },
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
      required: true,
    },
    
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }

  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};
userSchema.methods.isStudent = function () {
  return this.role === "student" && !this.isBanned;
};
userSchema.methods.isInstructor = function () {
  return this.role === "instructor" && !this.isBanned;
};
userSchema.methods.isAdmin = function () {
  return this.role === "admin" && !this.isBanned;
};

/* -----------------------------------------------------
 🚫 防止 Next.js Hot Reload 重複註冊模型
----------------------------------------------------- */
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
