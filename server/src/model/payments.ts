import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPayment>("Payment", paymentSchema);

