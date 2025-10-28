import mongoose from "mongoose";
import User from "./BaseModel";

const compounderSchema = new mongoose.Schema({
  // Add fields for compounder
  governmentId: { type: String, required: true },
  trainingCertificate: { type: String, required: true },
  policeVerificationCertificate: { type: String, required: true },
});

// Create compounder model using discriminator
const Compounder = User.discriminator("Compounder", compounderSchema);

export default Compounder;
