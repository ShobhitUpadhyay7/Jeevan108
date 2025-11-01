import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed";
  
  // Who is making the payment (Patient/User)
  paidBy: mongoose.Types.ObjectId;
  
  // Who is receiving the payment (Nurse/Caretaker/Compounder)
  paidTo: mongoose.Types.ObjectId;
  
  // Service details
  serviceType?: "Nurse" | "Caretaker" | "Compounder";
  serviceReference?: string; // e.g., booking ID, appointment ID, etc.
  description?: string;
  
  // Payment split (if platform takes commission)
  platformCommission?: number;
  professionalAmount?: number; // Amount that goes to the professional
  
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    razorpay_order_id: { type: String, required: true, unique: true, index: true },
    razorpay_payment_id: { type: String, sparse: true, index: true },
    razorpay_signature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
      index: true,
    },
    
    // Who is making the payment (Patient/User)
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Who is receiving the payment (Nurse/Caretaker/Compounder)
    paidTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Service details
    serviceType: {
      type: String,
      enum: ["Nurse", "Caretaker", "Compounder"],
      index: true,
    },
    serviceReference: { type: String }, // e.g., booking ID, appointment ID
    description: { type: String },
    
    // Payment split (if platform takes commission)
    platformCommission: { type: Number },
    professionalAmount: { type: Number }, // Amount that goes to the professional
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for common queries
paymentSchema.index({ paidBy: 1, createdAt: -1 }); // Get payments by patient
paymentSchema.index({ paidTo: 1, createdAt: -1 }); // Get payments to professional
paymentSchema.index({ serviceType: 1, status: 1 }); // Get payments by service type

export default mongoose.model<IPayment>("Payment", paymentSchema);

