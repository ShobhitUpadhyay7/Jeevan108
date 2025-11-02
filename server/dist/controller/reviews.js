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
exports.submitReview = submitReview;
exports.getWorkerReviews = getWorkerReviews;
exports.getBookingReview = getBookingReview;
exports.updateReview = updateReview;
const review_1 = __importDefault(require("../model/review"));
const booking_1 = __importDefault(require("../model/booking"));
const nurse_1 = __importDefault(require("../model/user/nurse"));
const caretaker_1 = __importDefault(require("../model/user/caretaker"));
const compounder_1 = __importDefault(require("../model/user/compounder"));
// Helper function to get worker model based on role
function getWorkerModel(role) {
    switch (role) {
        case "Nurse":
            return nurse_1.default;
        case "Caretaker":
            return caretaker_1.default;
        case "Compounder":
            return compounder_1.default;
        default:
            return null;
    }
}
// Helper function to update worker's average rating and review count
function updateWorkerRatings(workerId, workerRole) {
    return __awaiter(this, void 0, void 0, function* () {
        const WorkerModel = getWorkerModel(workerRole);
        if (!WorkerModel)
            return;
        const reviews = yield review_1.default.find({ workerId }).select("rating");
        const reviewCount = reviews.length;
        const averageRating = reviewCount > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            : 0;
        yield WorkerModel.findByIdAndUpdate(workerId, {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviewCount,
        });
    });
}
// Submit a review for a completed booking
function submitReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const patientId = req.userId;
            const { bookingId } = req.params;
            const { rating, comment } = req.body;
            // Validate input
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 1 and 5",
                });
            }
            // Find the booking
            const booking = yield booking_1.default.findById(bookingId)
                .populate("workerId", "role")
                .lean();
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }
            // Check if booking belongs to the patient
            if (booking.patientId.toString() !== patientId) {
                return res.status(403).json({
                    success: false,
                    message: "You can only review your own bookings",
                });
            }
            // Check if booking is completed
            if (booking.status !== "completed") {
                return res.status(400).json({
                    success: false,
                    message: "You can only review completed bookings",
                });
            }
            // Check if review already exists
            const existingReview = yield review_1.default.findOne({ bookingId });
            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: "You have already reviewed this booking",
                });
            }
            // Create review
            const review = yield review_1.default.create({
                bookingId,
                workerId: booking.workerId._id,
                patientId,
                rating,
                comment: comment || undefined,
            });
            // Update worker's average rating
            yield updateWorkerRatings(booking.workerId._id.toString(), booking.workerId.role);
            // Populate review data
            yield review.populate("patientId", "username");
            yield review.populate("bookingId");
            return res.json({
                success: true,
                message: "Review submitted successfully",
                review,
            });
        }
        catch (err) {
            console.error("Submit review error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to submit review",
                error: String(err),
            });
        }
    });
}
// Get reviews for a worker
function getWorkerReviews(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { workerId } = req.params;
            const { limit = 10, page = 1 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const reviews = yield review_1.default.find({ workerId })
                .populate("patientId", "username")
                .populate("bookingId", "serviceType startDate")
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip(skip)
                .lean();
            const totalReviews = yield review_1.default.countDocuments({ workerId });
            return res.json({
                success: true,
                reviews,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalReviews,
                    pages: Math.ceil(totalReviews / Number(limit)),
                },
            });
        }
        catch (err) {
            console.error("Get worker reviews error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch reviews",
                error: String(err),
            });
        }
    });
}
// Get review for a specific booking
function getBookingReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { bookingId } = req.params;
            const userId = req.userId;
            const booking = yield booking_1.default.findById(bookingId).lean();
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }
            // Check if booking belongs to the user
            if (booking.patientId.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }
            const review = yield review_1.default.findOne({ bookingId })
                .populate("patientId", "username")
                .lean();
            return res.json({
                success: true,
                review: review || null,
                canReview: booking.status === "completed" && !review,
            });
        }
        catch (err) {
            console.error("Get booking review error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch review",
                error: String(err),
            });
        }
    });
}
// Update a review
function updateReview(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const patientId = req.userId;
            const { reviewId } = req.params;
            const { rating, comment } = req.body;
            const review = yield review_1.default.findById(reviewId);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: "Review not found",
                });
            }
            // Check if review belongs to the patient
            if (review.patientId.toString() !== patientId) {
                return res.status(403).json({
                    success: false,
                    message: "You can only update your own reviews",
                });
            }
            // Validate rating if provided
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 1 and 5",
                });
            }
            // Update review
            if (rating !== undefined)
                review.rating = rating;
            if (comment !== undefined)
                review.comment = comment || undefined;
            yield review.save();
            // Update worker's average rating
            const booking = yield booking_1.default.findById(review.bookingId).populate("workerId", "role").lean();
            if (booking) {
                yield updateWorkerRatings(review.workerId.toString(), booking.workerId.role);
            }
            yield review.populate("patientId", "username");
            return res.json({
                success: true,
                message: "Review updated successfully",
                review,
            });
        }
        catch (err) {
            console.error("Update review error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to update review",
                error: String(err),
            });
        }
    });
}
