import mongoose from "mongoose";
import User from "./BaseModel";

const compounderSchema = new mongoose.Schema({
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
});

// Create compounder model using discriminator
const Compounder = User.discriminator("Compounder", compounderSchema);

export default Compounder;
