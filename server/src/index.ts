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
import reviewRoutes from "./routes/reviews";
import bookingRoutes from "./routes/booking";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit to handle base64 file uploads
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from uploads directory with proper headers
const uploadsPath = path.join(process.cwd(), "uploads");
app.use("/uploads", (req, res, next) => {
  // Set CORS headers explicitly for static files
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    // Set proper Content-Type for images based on extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    
    if (contentTypes[ext]) {
      res.setHeader("Content-Type", contentTypes[ext]);
    } else {
      // Default to octet-stream if type unknown
      res.setHeader("Content-Type", "application/octet-stream");
    }
    
    // Add cache control for images
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=31536000");
    }
    
    // Security headers to prevent blocking
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
}));

// Connect to DB
connectDB();

// ✅ API routes
app.use("/api/auth", userAuthRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/applications", applicationPublicRoutes);
app.use("/api/admin/applications", applicationAdminRoutes);
app.use("/api/admin/users", managedUsersRoutes);
app.use("/api", publicWorkersRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ Serve frontend (React build)
const __dirname1 = path.resolve();

// Serve static files from client/dist (Vite build)
app.use(express.static(path.join(__dirname1, "../client/dist")));

// Catch-all route to serve index.html for React Router
// Use middleware instead of wildcard route for Express 5 compatibility
app.use((req, res, next) => {
  // Skip if it's an API route or static file route
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  // Serve index.html for all other routes (React Router)
  res.sendFile(path.join(__dirname1, "../client/dist/index.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

