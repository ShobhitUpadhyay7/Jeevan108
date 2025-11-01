import express from "express";
import {
  createBooking,
  getPatientBookings,
  getWorkerBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getAllBookings,
} from "../controller/booking";
import { verifyJwt } from "../utils/auth";

// Alias for consistency
const authenticate = verifyJwt;

const router = express.Router();

// Patient routes
router.post("/", authenticate, createBooking); // Create booking (Patient)
router.get("/patient/me", authenticate, getPatientBookings); // Get patient's bookings

// Worker routes
router.get("/worker/me", authenticate, getWorkerBookings); // Get worker's bookings
router.put("/:id/status", authenticate, updateBookingStatus); // Update booking status (Worker/Admin)

// Common routes
router.get("/:id", authenticate, getBookingById); // Get booking by ID
router.delete("/:id", authenticate, cancelBooking); // Cancel booking

// Admin/Staff routes
router.get("/", authenticate, getAllBookings); // Get all bookings (Admin/Staff)

export default router;

