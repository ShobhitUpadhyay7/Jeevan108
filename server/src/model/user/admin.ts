import mongoose from "mongoose";
import User from "./BaseModel";

const adminSchema = new mongoose.Schema({
  // Add fields for admin
});

const Admin = User.discriminator("Admin", adminSchema);

export default Admin;
