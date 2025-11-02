"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./config/database"));
const BaseRoutes_1 = __importDefault(require("./routes/user/BaseRoutes"));
const StaffRoutes_1 = __importDefault(require("./routes/user/StaffRoutes"));
const ApplicationPublicRoutes_1 = __importDefault(require("./routes/user/ApplicationPublicRoutes"));
const ApplicationAdminRoutes_1 = __importDefault(require("./routes/user/ApplicationAdminRoutes"));
const ManagedUsersRoutes_1 = __importDefault(require("./routes/user/ManagedUsersRoutes"));
const PublicWorkersRoutes_1 = __importDefault(require("./routes/user/PublicWorkersRoutes"));
const payments_1 = __importDefault(require("./routes/payments"));
const chatbot_1 = __importDefault(require("./routes/chatbot"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const booking_1 = __importDefault(require("./routes/booking"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "50mb" })); // Increase limit to handle base64 file uploads
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
// Serve static files from uploads directory with proper headers
const uploadsPath = path_1.default.join(process.cwd(), "uploads");
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
}, express_1.default.static(uploadsPath, {
    setHeaders: (res, filePath) => {
        // Set proper Content-Type for images based on extension
        const ext = path_1.default.extname(filePath).toLowerCase();
        const contentTypes = {
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
        }
        else {
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
(0, database_1.default)();
// ✅ API routes
app.use("/api/auth", BaseRoutes_1.default);
app.use("/api/staff", StaffRoutes_1.default);
app.use("/api/applications", ApplicationPublicRoutes_1.default);
app.use("/api/admin/applications", ApplicationAdminRoutes_1.default);
app.use("/api/admin/users", ManagedUsersRoutes_1.default);
app.use("/api", PublicWorkersRoutes_1.default);
app.use("/api/payments", payments_1.default);
app.use("/api/chatbot", chatbot_1.default);
app.use("/api/reviews", reviews_1.default);
app.use("/api/bookings", booking_1.default);
// ✅ Serve frontend (React build)
const __dirname1 = path_1.default.resolve();
// Serve static files from client/dist (Vite build)
app.use(express_1.default.static(path_1.default.join(__dirname1, "../client/dist")));
// Catch-all route to serve index.html for React Router
// Use middleware instead of wildcard route for Express 5 compatibility
app.use((req, res, next) => {
    // Skip if it's an API route or static file route
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
    }
    // Serve index.html for all other routes (React Router)
    res.sendFile(path_1.default.join(__dirname1, "../client/dist/index.html"));
});
// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
