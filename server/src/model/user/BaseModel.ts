import mongoose from "mongoose";

const BaseUser = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    profilePicture: { type: String },
    role: {
      type: String,
      enum: [
        "User",
        "Admin",
        "Staff",
        "Nurse",
        "Caretaker",
        "Compounder",
        "Patient",
      ],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { discriminatorKey: "role" }
);

const User = mongoose.model("User", BaseUser);

export default User;
