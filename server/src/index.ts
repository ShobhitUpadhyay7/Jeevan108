import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/database";
import userAuthRoutes from "./routes/user/BaseRoutes";
import staffRoutes from "./routes/user/StaffRoutes";
import applicationPublicRoutes from "./routes/user/ApplicationPublicRoutes";
import applicationAdminRoutes from "./routes/user/ApplicationAdminRoutes";
import managedUsersRoutes from "./routes/user/ManagedUsersRoutes";
import publicWorkersRoutes from "./routes/user/PublicWorkersRoutes";
import paymentRoutes from "./routes/payments";
import chatbotRoutes from "./routes/chatbot";
import bookingRoutes from "./routes/booking";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit to handle base64 file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

connectDB();

app.get("/", (_req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", userAuthRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/applications", applicationPublicRoutes);
app.use("/api/admin/applications", applicationAdminRoutes);
app.use("/api/admin/users", managedUsersRoutes);
app.use("/api", publicWorkersRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/bookings", bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
