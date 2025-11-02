"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const compounderSchema = new mongoose_1.default.Schema({
    // Add fields for compounder
    governmentId: { type: String, required: true },
    trainingCertificate: { type: String, required: true },
    policeVerificationCertificate: { type: String, required: true },
    // Pricing
    hourlyRate: { type: Number, default: 450, min: 0 }, // Default ₹450 per hour
    dailyRate: { type: Number, default: 2800, min: 0 }, // Default ₹2800 per day
    weeklyRate: { type: Number, default: 16800, min: 0 }, // Default ₹16800 per week
    // Availability (optional - can be extended later)
    isAvailable: { type: Boolean, default: true },
    // Ratings and Reviews (computed from Review model)
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Create compounder model using discriminator
const Compounder = BaseModel_1.default.discriminator("Compounder", compounderSchema);
exports.default = Compounder;
