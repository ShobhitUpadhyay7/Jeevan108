"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PendingApplicationSchema = new mongoose_1.default.Schema({
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
    reviewedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
}, { timestamps: { createdAt: "submittedAt", updatedAt: true } });
const PendingApplication = mongoose_1.default.model("PendingApplication", PendingApplicationSchema);
exports.default = PendingApplication;
