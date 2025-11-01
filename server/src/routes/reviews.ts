import express from "express";
import {
  submitReview,
  getWorkerReviews,
  getBookingReview,
  updateReview,
} from "../controller/reviews";
import { verifyJwt } from "../utils/auth";

const router = express.Router();

// Submit a review for a completed booking (Patient only)
router.post("/booking/:bookingId", verifyJwt, submitReview);

// Get reviews for a worker (Public)
router.get("/worker/:workerId", getWorkerReviews);

// Get review for a specific booking (Patient only)
router.get("/booking/:bookingId", verifyJwt, getBookingReview);

// Update a review (Patient only)
router.put("/:reviewId", verifyJwt, updateReview);

export default router;

