"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const paymentSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    // Who is receiving the payment (Nurse/Caretaker/Compounder)
    paidTo: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
});
// Indexes for common queries
paymentSchema.index({ paidBy: 1, createdAt: -1 }); // Get payments by patient
paymentSchema.index({ paidTo: 1, createdAt: -1 }); // Get payments to professional
paymentSchema.index({ serviceType: 1, status: 1 }); // Get payments by service type
exports.default = mongoose_1.default.model("Payment", paymentSchema);
