"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const BaseModel_1 = __importDefault(require("./BaseModel"));
const nurseSchema = new mongoose_1.default.Schema({
    governmentId: { type: String, required: true },
    nursingRegistrationCertificate: { type: String, required: true },
    policeVerificationCertificate: { type: String, required: true },
    // Pricing
    hourlyRate: { type: Number, default: 500, min: 0 }, // Default ₹500 per hour
    dailyRate: { type: Number, default: 3000, min: 0 }, // Default ₹3000 per day
    weeklyRate: { type: Number, default: 18000, min: 0 }, // Default ₹18000 per week
    // Availability (optional - can be extended later)
    isAvailable: { type: Boolean, default: true },
    // Ratings and Reviews (computed from Review model)
    // These will be calculated dynamically, but we can cache them
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
}, {
    // Virtual for getting reviews (will be populated as needed)
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Create nurse model using discriminator
const Nurse = BaseModel_1.default.discriminator("Nurse", nurseSchema);
exports.default = Nurse;
