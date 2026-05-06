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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.createOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const payments_1 = __importDefault(require("../model/payments"));
function normalizeServiceType(role) {
    if (!role)
        return undefined;
    const normalized = role.trim().toLowerCase();
    if (normalized === "nurse")
        return "Nurse";
    if (normalized === "caretaker")
        return "Caretaker";
    if (normalized === "compounder")
        return "Compounder";
    return undefined;
}
// Lazy initialization of Razorpay to ensure env vars are loaded
function getRazorpayInstance() {
    var _a, _b;
    const keyId = (_a = process.env.RAZORPAY_KEY_ID) === null || _a === void 0 ? void 0 : _a.trim().replace(/^['"]|['"]$/g, "");
    const keySecret = (_b = process.env.RAZORPAY_KEY_SECRET) === null || _b === void 0 ? void 0 : _b.trim().replace(/^['"]|['"]$/g, "");
    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file");
    }
    console.log("🔑 Razorpay credentials loaded:", {
        keyId: keyId.substring(0, 10) + "..." + keyId.substring(keyId.length - 4),
        keySecret: "***" + keySecret.substring(keySecret.length - 4),
    });
    return new razorpay_1.default({
        key_id: keyId,
        key_secret: keySecret,
    });
}
// ✅ Create Razorpay order
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, paidTo, serviceType, serviceReference, description, platformCommission } = req.body;
        const userId = req.userId; // From JWT middleware
        if (!amount || !paidTo) {
            return res.status(400).json({
                success: false,
                message: "Amount and paidTo (professional ID) are required"
            });
        }
        if (Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0",
            });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(String(paidTo))) {
            return res.status(400).json({
                success: false,
                message: "Invalid professional ID",
            });
        }
        const normalizedServiceType = normalizeServiceType(serviceType);
        if (serviceType && !normalizedServiceType) {
            return res.status(400).json({
                success: false,
                message: "Invalid service type. Must be Nurse, Caretaker, or Compounder",
            });
        }
        // Calculate professional amount if commission is specified
        const professionalAmount = platformCommission
            ? amount - (amount * platformCommission / 100)
            : amount;
        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                paidBy: userId,
                paidTo: paidTo,
                serviceType: normalizedServiceType || "",
            },
        };
        const razorpay = getRazorpayInstance();
        const order = yield razorpay.orders.create(options);
        console.log("✅ Razorpay order created successfully:", order.id);
        yield payments_1.default.create({
            razorpay_order_id: order.id,
            amount,
            currency: order.currency,
            status: "created",
            paidBy: userId,
            paidTo,
            serviceType: normalizedServiceType,
            serviceReference,
            description,
            platformCommission,
            professionalAmount,
        });
        // Return order along with Razorpay key ID for frontend
        res.json({
            success: true,
            order,
            keyId: process.env.RAZORPAY_KEY_ID // Safe to expose key ID
        });
    }
    catch (error) {
        console.error("❌ Razorpay order creation failed:", error);
        const razorpayErrorDescription = (_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.description;
        const message = razorpayErrorDescription ||
            (error instanceof Error ? error.message : "Error creating Razorpay order");
        const isAuthenticationError = /authentication failed|invalid api key|unauthorized/i.test(message);
        console.log("🔍 Error details:", {
            isAuthenticationError,
            message,
            errorType: error instanceof Error ? error.constructor.name : typeof error,
        });
        res.status(isAuthenticationError ? 503 : 500).json({
            success: false,
            paymentSetupRequired: isAuthenticationError,
            message: isAuthenticationError
                ? "Razorpay authentication failed on the server. Booking was saved, but payment could not be started."
                : message,
        });
    }
});
exports.createOrder = createOrder;
// ✅ Verify payment after success
const verifyPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto_1.default
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign)
            .digest("hex");
        const payment = yield payments_1.default.findOne({ razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        if (razorpay_signature === expectedSign) {
            payment.status = "paid";
            payment.razorpay_payment_id = razorpay_payment_id;
            payment.razorpay_signature = razorpay_signature;
            yield payment.save();
            // If payment has a serviceReference (booking ID), update booking payment status
            if (payment.serviceReference) {
                try {
                    const Booking = (yield Promise.resolve().then(() => __importStar(require("../model/booking")))).default;
                    const booking = yield Booking.findById(payment.serviceReference);
                    if (booking) {
                        booking.paymentId = payment._id;
                        booking.paymentStatus = "paid";
                        booking.status = "confirmed"; // Auto-confirm booking after payment
                        yield booking.save();
                    }
                }
                catch (bookingError) {
                    console.error("Error updating booking payment status:", bookingError);
                    // Don't fail payment verification if booking update fails
                }
            }
            res.json({ success: true, message: "Payment verified successfully", payment });
        }
        else {
            payment.status = "failed";
            yield payment.save();
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error verifying payment" });
    }
});
exports.verifyPayment = verifyPayment;
