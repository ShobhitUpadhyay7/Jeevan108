import mongoose from "mongoose";
import User from "./BaseModel";

const caretakerSchema = new mongoose.Schema({
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
const Caretaker = User.discriminator("Caretaker", caretakerSchema);

export default Caretaker;
