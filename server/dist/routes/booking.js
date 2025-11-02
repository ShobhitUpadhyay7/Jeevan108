"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const booking_1 = require("../controller/booking");
const auth_1 = require("../utils/auth");
// Alias for consistency
const authenticate = auth_1.verifyJwt;
const router = express_1.default.Router();
// Patient routes
router.post("/", authenticate, booking_1.createBooking); // Create booking (Patient)
router.get("/patient/me", authenticate, booking_1.getPatientBookings); // Get patient's bookings
// Worker routes
router.get("/worker/me", authenticate, booking_1.getWorkerBookings); // Get worker's bookings
router.put("/:id/status", authenticate, booking_1.updateBookingStatus); // Update booking status (Worker/Admin)
// Common routes
router.get("/:id", authenticate, booking_1.getBookingById); // Get booking by ID
router.delete("/:id", authenticate, booking_1.cancelBooking); // Cancel booking
// Admin/Staff routes
router.get("/", authenticate, booking_1.getAllBookings); // Get all bookings (Admin/Staff)
exports.default = router;
