import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discountRate: { type: Number, required: true, min: 0, max: 1 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date },
  isActive: { type: Boolean, default: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.validUntil && now > this.validUntil) return false;
  return true;
};

const coupon = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default coupon;
