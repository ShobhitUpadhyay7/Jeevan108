import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";
import userAuthRoutes from "./routes/user/BaseRoutes";
import staffRoutes from "./routes/user/StaffRoutes";
import applicationPublicRoutes from "./routes/user/ApplicationPublicRoutes";
import applicationAdminRoutes from "./routes/user/ApplicationAdminRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (_req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", userAuthRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/applications", applicationPublicRoutes);
app.use("/api/admin/applications", applicationAdminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
