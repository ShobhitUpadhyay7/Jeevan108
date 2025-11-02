"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviews_1 = require("../controller/reviews");
const auth_1 = require("../utils/auth");
const router = express_1.default.Router();
// Submit a review for a completed booking (Patient only)
router.post("/booking/:bookingId", auth_1.verifyJwt, reviews_1.submitReview);
// Get reviews for a worker (Public)
router.get("/worker/:workerId", reviews_1.getWorkerReviews);
// Get review for a specific booking (Patient only)
router.get("/booking/:bookingId", auth_1.verifyJwt, reviews_1.getBookingReview);
// Update a review (Patient only)
router.put("/:reviewId", auth_1.verifyJwt, reviews_1.updateReview);
exports.default = router;
