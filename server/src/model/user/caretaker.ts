import mongoose from "mongoose";
import User from "./BaseModel";

const caretakerSchema = new mongoose.Schema({
  // Add fields for caretaker
  governmentId: { type: String, required: true },
  policeVerificationCertificate: { type: String, required: true },
});

// Create caretaker model using discriminator
const Caretaker = User.discriminator("Caretaker", caretakerSchema);

export default Caretaker;
