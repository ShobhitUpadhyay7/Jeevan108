"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.me = me;
exports.updateMyProfile = updateMyProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BaseModel_1 = __importDefault(require("../../model/user/BaseModel"));
const nurse_1 = __importDefault(require("../../model/user/nurse"));
const caretaker_1 = __importDefault(require("../../model/user/caretaker"));
const compounder_1 = __importDefault(require("../../model/user/compounder"));
const admin_1 = __importDefault(require("../../model/user/admin"));
const staff_1 = __importDefault(require("../../model/user/staff"));
const patient_1 = __importDefault(require("../../model/user/patient"));
const upload_1 = require("../../utils/upload");
const roleToModel = {
    User: BaseModel_1.default,
    Admin: admin_1.default,
    Staff: staff_1.default,
    Nurse: nurse_1.default,
    Caretaker: caretaker_1.default,
    Compounder: compounder_1.default,
    Patient: patient_1.default
};
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET is not configured");
    return secret;
}
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { username, email, password, phone, role, address, profilePicture, } = req.body || {};
            if (!username || !email || !password || !phone) {
                return res
                    .status(400)
                    .json({ message: "username, email, password, phone are required" });
            }
            const existing = yield BaseModel_1.default.findOne({ email }).lean();
            if (existing) {
                return res.status(409).json({ message: "Email already registered" });
            }
            const passwordHash = yield bcryptjs_1.default.hash(password, 10);
            // Process profile picture: upload to Cloudinary
            let processedProfilePicture;
            if (profilePicture && typeof profilePicture === "string" && profilePicture.trim()) {
                // Check if it's a base64 string (new upload) or already a URL
                if (profilePicture.startsWith("data:image/") || profilePicture.startsWith("data:application/")) {
                    // It's a base64 string, upload to Cloudinary
                    try {
                        processedProfilePicture = yield (0, upload_1.uploadToCloudinary)(profilePicture, "image", "jeevan108/users");
                    }
                    catch (picError) {
                        console.error("Error uploading profile picture to Cloudinary:", picError);
                        // Don't fail the entire registration if profile picture fails
                    }
                }
                else if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
                    // It's already a URL, use it as is
                    processedProfilePicture = profilePicture;
                }
            }
            const Model = role && roleToModel[role] ? roleToModel[role] : BaseModel_1.default;
            const created = yield Model.create({
                username,
                email,
                password: passwordHash,
                phone,
                address,
                profilePicture: processedProfilePicture,
            });
            return res.status(201).json({
                id: created._id,
                username: created.username,
                email: created.email,
                phone: created.phone,
                role: role && roleToModel[role] ? role : "User",
            });
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Registration failed", error: String(err) });
        }
    });
}
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ message: "email and password are required" });
            }
            const user = yield BaseModel_1.default.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const isMatch = yield bcryptjs_1.default.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            const token = jsonwebtoken_1.default.sign({ sub: String(user._id), email: user.email }, getJwtSecret(), { expiresIn: "7d" });
            return res.json({ token });
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Login failed", error: String(err) });
        }
    });
}
function me(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            // First get basic user info to check role
            const user = yield BaseModel_1.default.findById(userId).select("username email phone role");
            if (!user)
                return res.status(404).json({ message: "Not found" });
            // If user is a worker (Nurse, Caretaker, Compounder), fetch full profile with documents
            const workerRoles = ["Nurse", "Caretaker", "Compounder"];
            if (user.role && workerRoles.includes(user.role)) {
                const Model = roleToModel[user.role];
                if (Model) {
                    const fullProfile = yield Model.findById(userId);
                    if (fullProfile) {
                        return res.json(fullProfile);
                    }
                }
            }
            // For other roles, return basic info
            return res.json(user);
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Failed to fetch profile", error: String(err) });
        }
    });
}
function updateMyProfile(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Unauthorized" });
            // Get user to check role
            const user = yield BaseModel_1.default.findById(userId).select("role");
            if (!user)
                return res.status(404).json({ message: "Not found" });
            const { username, email, phone, address, profilePicture, hourlyRate, dailyRate, weeklyRate, password, } = req.body || {};
            // Determine which model to use based on role
            const workerRoles = ["Nurse", "Caretaker", "Compounder"];
            const Model = user.role && roleToModel[user.role] ? roleToModel[user.role] : BaseModel_1.default;
            // Get current user to check for old profile picture
            const currentUser = yield Model.findById(userId);
            if (!currentUser)
                return res.status(404).json({ message: "Not found" });
            // Process profile picture: upload to Cloudinary
            let processedProfilePicture = currentUser.profilePicture; // Keep existing by default
            if (profilePicture && typeof profilePicture === "string" && profilePicture.trim()) {
                // Check if it's a base64 string (new upload) or already a URL
                if (profilePicture.startsWith("data:image/") || profilePicture.startsWith("data:application/")) {
                    // It's a base64 string, upload to Cloudinary
                    try {
                        console.log("📤 Starting Cloudinary upload for profile picture...");
                        // Delete old profile picture if it exists (only if it's a Cloudinary URL)
                        if (currentUser.profilePicture) {
                            try {
                                console.log("🗑️  Deleting old profile picture...");
                                yield (0, upload_1.deleteFile)(currentUser.profilePicture, "image");
                            }
                            catch (delError) {
                                console.error("⚠️  Error deleting old profile picture (non-fatal):", delError);
                            }
                        }
                        processedProfilePicture = yield (0, upload_1.uploadToCloudinary)(profilePicture, "image", "jeevan108/users");
                        console.log("✅ Profile picture uploaded successfully:", processedProfilePicture);
                    }
                    catch (picError) {
                        console.error("❌ Error uploading profile picture to Cloudinary:", picError);
                        // Don't fail the entire update if profile picture fails
                    }
                }
                else if (profilePicture.startsWith("http://") || profilePicture.startsWith("https://")) {
                    // It's already a URL, use it as is
                    processedProfilePicture = profilePicture;
                }
            }
            // Build update object
            const update = {};
            if (username !== undefined)
                update.username = username;
            if (email !== undefined)
                update.email = email;
            if (phone !== undefined)
                update.phone = phone;
            if (address !== undefined)
                update.address = address;
            if (processedProfilePicture !== undefined)
                update.profilePicture = processedProfilePicture;
            // Only allow pricing updates for workers
            if (user.role && workerRoles.includes(user.role)) {
                if (hourlyRate !== undefined)
                    update.hourlyRate = hourlyRate;
                if (dailyRate !== undefined)
                    update.dailyRate = dailyRate;
                if (weeklyRate !== undefined)
                    update.weeklyRate = weeklyRate;
            }
            // Handle password update
            if (password) {
                update.password = yield bcryptjs_1.default.hash(password, 10);
            }
            const updated = yield Model.findByIdAndUpdate(userId, { $set: update }, { new: true });
            if (!updated)
                return res.status(404).json({ message: "Not found" });
            return res.json(updated);
        }
        catch (err) {
            return res
                .status(500)
                .json({ message: "Update failed", error: String(err) });
        }
    });
}
