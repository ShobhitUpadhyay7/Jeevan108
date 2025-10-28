import mongoose from "mongoose";
import User from "./BaseModel";

const patientSchema = new mongoose.Schema({
  // Add fields for patient
});

// Create patient model using discriminator
const Patient = User.discriminator("Patient", patientSchema);

export default Patient;
