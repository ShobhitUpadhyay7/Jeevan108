"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../utils/auth");
const payments_1 = require("../controller/payments");
const router = (0, express_1.Router)();
// All payment routes require authentication
router.use(auth_1.verifyJwt);
// Create Razorpay order
router.post("/create-order", payments_1.createOrder);
// Verify payment after success
router.post("/verify", payments_1.verifyPayment);
exports.default = router;
