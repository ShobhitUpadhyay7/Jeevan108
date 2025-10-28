import mongoose from "mongoose";
import User from "./BaseModel";

const nurseSchema = new mongoose.Schema({
  governmentId: { type: String, required: true },
  nursingRegistrationCertificate: { type: String, required: true },
  policeVerificationCertificate: { type: String, required: true },
});

// Create nurse model using discriminator
const Nurse = User.discriminator("Nurse", nurseSchema);

export default Nurse;
