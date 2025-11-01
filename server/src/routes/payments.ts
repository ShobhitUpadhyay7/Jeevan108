import { Router } from "express";
import { verifyJwt } from "../utils/auth";
import { createOrder, verifyPayment } from "../controller/payments";

const router = Router();

// All payment routes require authentication
router.use(verifyJwt);

// Create Razorpay order
router.post("/create-order", createOrder);

// Verify payment after success
router.post("/verify", verifyPayment);

export default router;
