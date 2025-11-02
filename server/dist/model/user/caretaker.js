"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const caretakerSchema = new mongoose_1.default.Schema({
    // Add fields for caretaker
    governmentId: { type: String, required: true },
    policeVerificationCertificate: { type: String, required: true },
    // Pricing
    hourlyRate: { type: Number, default: 400, min: 0 }, // Default ₹400 per hour
    dailyRate: { type: Number, default: 2500, min: 0 }, // Default ₹2500 per day
    weeklyRate: { type: Number, default: 15000, min: 0 }, // Default ₹15000 per week
    // Availability (optional - can be extended later)
    isAvailable: { type: Boolean, default: true },
    // Ratings and Reviews (computed from Review model)
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Create caretaker model using discriminator
const Caretaker = BaseModel_1.default.discriminator("Caretaker", caretakerSchema);
exports.default = Caretaker;
