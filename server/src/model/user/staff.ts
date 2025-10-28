import mongoose from "mongoose";
import User from "./BaseModel";

const staffSchema = new mongoose.Schema({
  // Add fields for staff
});

const Staff = User.discriminator("Staff", staffSchema);

export default Staff;
