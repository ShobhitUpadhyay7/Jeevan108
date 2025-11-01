import mongoose from "mongoose";

const PendingApplicationSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true }, // stored hashed on submit for safety
    phone: { type: String, required: true },
    address: { type: String },
    profilePicture: { type: String },
    role: {
      type: String,
      enum: ["Nurse", "Caretaker", "Compounder"],
      required: true,
    },
    documents: {
      governmentId: { type: String },
      nursingRegistrationCertificate: { type: String },
      trainingCertificate: { type: String },
      policeVerificationCertificate: { type: String },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: { createdAt: "submittedAt", updatedAt: true } }
);

const PendingApplication = mongoose.model(
  "PendingApplication",
  PendingApplicationSchema
);

export default PendingApplication;
