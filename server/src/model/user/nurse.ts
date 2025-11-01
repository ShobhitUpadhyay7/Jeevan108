import mongoose from "mongoose";
import User from "./BaseModel";

const nurseSchema = new mongoose.Schema({
  governmentId: { type: String, required: true },
  nursingRegistrationCertificate: { type: String, required: true },
  policeVerificationCertificate: { type: String, required: true },
  
  // Pricing
  hourlyRate: { type: Number, default: 500, min: 0 }, // Default ₹500 per hour
  dailyRate: { type: Number, default: 3000, min: 0 }, // Default ₹3000 per day
  weeklyRate: { type: Number, default: 18000, min: 0 }, // Default ₹18000 per week
  
  // Availability (optional - can be extended later)
  isAvailable: { type: Boolean, default: true },
});

// Create nurse model using discriminator
const Nurse = User.discriminator("Nurse", nurseSchema);

export default Nurse;
