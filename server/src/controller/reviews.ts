import { Request, Response } from "express";
import Review from "../model/review";
import Booking from "../model/booking";
import User from "../model/user/BaseModel";
import Nurse from "../model/user/nurse";
import Caretaker from "../model/user/caretaker";
import Compounder from "../model/user/compounder";

// Helper function to get worker model based on role
function getWorkerModel(role: string) {
  switch (role) {
    case "Nurse":
      return Nurse;
    case "Caretaker":
      return Caretaker;
    case "Compounder":
      return Compounder;
    default:
      return null;
  }
}

// Helper function to update worker's average rating and review count
async function updateWorkerRatings(workerId: string, workerRole: string) {
  const WorkerModel = getWorkerModel(workerRole);
  if (!WorkerModel) return;

  const reviews = await Review.find({ workerId }).select("rating");
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;

  await (WorkerModel as any).findByIdAndUpdate(workerId, {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    reviewCount,
  });
}

// Submit a review for a completed booking
export async function submitReview(req: Request, res: Response) {
  try {
    const patientId = (req as any).userId;
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
    const booking = await Booking.findById(bookingId)
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
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this booking",
      });
    }

    // Create review
    const review = await Review.create({
      bookingId,
      workerId: booking.workerId._id,
      patientId,
      rating,
      comment: comment || undefined,
    });

    // Update worker's average rating
    await updateWorkerRatings(
      booking.workerId._id.toString(),
      (booking.workerId as any).role
    );

    // Populate review data
    await review.populate("patientId", "username");
    await review.populate("bookingId");

    return res.json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (err) {
    console.error("Submit review error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: String(err),
    });
  }
}

// Get reviews for a worker
export async function getWorkerReviews(req: Request, res: Response) {
  try {
    const { workerId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({ workerId })
      .populate("patientId", "username")
      .populate("bookingId", "serviceType startDate")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip)
      .lean();

    const totalReviews = await Review.countDocuments({ workerId });

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
  } catch (err) {
    console.error("Get worker reviews error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: String(err),
    });
  }
}

// Get review for a specific booking
export async function getBookingReview(req: Request, res: Response) {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).userId;

    const booking = await Booking.findById(bookingId).lean();
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

    const review = await Review.findOne({ bookingId })
      .populate("patientId", "username")
      .lean();

    return res.json({
      success: true,
      review: review || null,
      canReview: booking.status === "completed" && !review,
    });
  } catch (err) {
    console.error("Get booking review error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch review",
      error: String(err),
    });
  }
}

// Update a review
export async function updateReview(req: Request, res: Response) {
  try {
    const patientId = (req as any).userId;
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
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
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment || undefined;

    await review.save();

    // Update worker's average rating
    const booking = await Booking.findById(review.bookingId).populate("workerId", "role").lean();
    if (booking) {
      await updateWorkerRatings(
        review.workerId.toString(),
        (booking.workerId as any).role
      );
    }

    await review.populate("patientId", "username");

    return res.json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (err) {
    console.error("Update review error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: String(err),
    });
  }
}

