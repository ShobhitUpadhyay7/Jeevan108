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
const bookingSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    workerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    workerRole: {
        type: String,
        enum: ["Nurse", "Caretaker", "Compounder"],
        required: true,
        index: true,
    },
    serviceType: {
        type: String,
        enum: ["hourly", "daily", "weekly"],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
        index: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: "startTime must be in HH:mm format",
        },
    },
    endTime: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
            },
            message: "endTime must be in HH:mm format",
        },
    },
    duration: {
        type: Number,
        required: true,
        min: 0,
    },
    hourlyRate: {
        type: Number,
        min: 0,
    },
    dailyRate: {
        type: Number,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    serviceAddress: {
        type: String,
        required: true,
    },
    patientName: {
        type: String,
        required: true,
    },
    patientPhone: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
        default: "pending",
        index: true,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Payment",
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending",
        index: true,
    },
    cancelledAt: {
        type: Date,
    },
    cancelledBy: {
        type: String,
        enum: ["patient", "worker", "admin"],
    },
    cancellationReason: {
        type: String,
    },
    completedAt: {
        type: Date,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
// Indexes for common queries
bookingSchema.index({ patientId: 1, createdAt: -1 }); // Get bookings by patient
bookingSchema.index({ workerId: 1, createdAt: -1 }); // Get bookings by worker
bookingSchema.index({ workerId: 1, startDate: 1, status: 1 }); // Check availability
bookingSchema.index({ status: 1, createdAt: -1 }); // Get bookings by status
bookingSchema.index({ paymentStatus: 1 }); // Get bookings by payment status
// Compound index for availability checking
bookingSchema.index({ workerId: 1, startDate: 1, endDate: 1, status: 1 });
exports.default = mongoose_1.default.model("Booking", bookingSchema);
