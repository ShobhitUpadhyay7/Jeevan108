import { Request, Response } from "express";
import Booking, { IBooking } from "../model/booking";
import Nurse from "../model/user/nurse";
import Caretaker from "../model/user/caretaker";
import Compounder from "../model/user/compounder";
import User from "../model/user/BaseModel";

// Helper to get worker model by role
function getWorkerModel(role: string): typeof Nurse | typeof Caretaker | typeof Compounder | null {
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

// Helper to check availability
async function checkAvailability(
  workerId: string,
  startDate: Date,
  endDate: Date,
  startTime: string,
  endTime: string
): Promise<boolean> {
  // Check for overlapping bookings
  const overlappingBookings = await Booking.find({
    workerId,
    status: { $in: ["pending", "confirmed", "in_progress"] },
    $or: [
      // New booking starts during existing booking
      {
        startDate: { $lte: startDate },
        endDate: { $gte: startDate },
      },
      // New booking ends during existing booking
      {
        startDate: { $lte: endDate },
        endDate: { $gte: endDate },
      },
      // New booking completely contains existing booking
      {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      },
    ],
  });

  // If same date, check time overlap
  if (overlappingBookings.length > 0) {
    for (const booking of overlappingBookings) {
      const bookingStart = booking.startDate;
      const bookingEnd = booking.endDate;
      
      // If dates overlap, check time slots
      if (
        bookingStart.toDateString() === startDate.toDateString() ||
        bookingEnd.toDateString() === endDate.toDateString() ||
        (startDate <= bookingEnd && endDate >= bookingStart)
      ) {
        // Parse times
        const [newStartHour, newStartMin] = startTime.split(":").map(Number);
        const [newEndHour, newEndMin] = endTime.split(":").map(Number);
        const [bookingStartHour, bookingStartMin] = booking.startTime.split(":").map(Number);
        const [bookingEndHour, bookingEndMin] = booking.endTime.split(":").map(Number);

        const newStartMinutes = newStartHour * 60 + newStartMin;
        const newEndMinutes = newEndHour * 60 + newEndMin;
        const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
        const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;

        // Check time overlap
        if (
          (newStartMinutes >= bookingStartMinutes && newStartMinutes < bookingEndMinutes) ||
          (newEndMinutes > bookingStartMinutes && newEndMinutes <= bookingEndMinutes) ||
          (newStartMinutes <= bookingStartMinutes && newEndMinutes >= bookingEndMinutes)
        ) {
          return false; // Time overlap found
        }
      }
    }
  }

  return true; // Available
}

// Calculate total amount based on service type and duration
function calculateAmount(
  serviceType: "hourly" | "daily" | "weekly",
  duration: number,
  hourlyRate?: number,
  dailyRate?: number,
  weeklyRate?: number
): number {
  switch (serviceType) {
    case "hourly":
      return (hourlyRate || 0) * duration;
    case "daily":
      return (dailyRate || 0) * duration;
    case "weekly":
      return (weeklyRate || 0) * duration;
    default:
      return 0;
  }
}

// Create a new booking
export async function createBooking(req: Request, res: Response) {
  try {
    const patientId = (req as any).userId; // From JWT middleware
    const {
      workerId,
      workerRole,
      serviceType,
      startDate,
      endDate,
      startTime,
      endTime,
      duration,
      serviceAddress,
      patientName,
      patientPhone,
      notes,
    } = req.body;

    // Validate required fields (patientName and patientPhone can come from user profile if not provided)
    if (!workerId || !workerRole || !serviceType || !startDate || !endDate || !startTime || !endTime || !duration || !serviceAddress) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify patient/user exists - check User model (Patient is a discriminator of User)
    const user = await User.findById(patientId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Use user data as patient (User model includes Patient discriminator)
    const patient = user;

    // Auto-fill patientName and patientPhone from user profile if not provided
    const finalPatientName = patientName || (patient as any).username || "";
    const finalPatientPhone = patientPhone || (patient as any).phone || "";

    if (!finalPatientName || !finalPatientPhone) {
      return res.status(400).json({
        success: false,
        message: "Patient name and phone are required",
      });
    }

    // Verify worker exists and get pricing
    const WorkerModel = getWorkerModel(workerRole);
    if (!WorkerModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid worker role",
      });
    }

    const worker = await (WorkerModel as typeof Nurse).findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Check if worker is available
    if (!worker.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Worker is currently not available for booking",
      });
    }

    // Parse dates
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    // Validate dates
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    if (startDateTime < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot book in the past",
      });
    }

    // Check availability
    const isAvailable = await checkAvailability(
      workerId,
      startDateTime,
      endDateTime,
      startTime,
      endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Worker is not available for the selected time slot",
      });
    }

    // Calculate total amount
    const hourlyRate = (worker as any).hourlyRate || 0;
    const dailyRate = (worker as any).dailyRate || 0;
    const weeklyRate = (worker as any).weeklyRate || 0;

    const totalAmount = calculateAmount(
      serviceType,
      duration,
      hourlyRate,
      dailyRate,
      weeklyRate
    );

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid pricing configuration",
      });
    }

    // Create booking
    const booking = new Booking({
      patientId,
      workerId,
      workerRole,
      serviceType,
      startDate: startDateTime,
      endDate: endDateTime,
      startTime,
      endTime,
      duration,
      hourlyRate: serviceType === "hourly" ? hourlyRate : undefined,
      dailyRate: serviceType === "daily" ? dailyRate : undefined,
      totalAmount,
      serviceAddress,
      patientName: finalPatientName,
      patientPhone: finalPatientPhone,
      notes,
      status: "pending",
      paymentStatus: "pending",
    });

    await booking.save();

    // Populate references
    await booking.populate("patientId", "username email phone");
    await booking.populate("workerId", "username email phone profilePicture");

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: String(err),
    });
  }
}

// Get bookings for authenticated patient
export async function getPatientBookings(req: Request, res: Response) {
  try {
    const patientId = (req as any).userId;

    const { status } = req.query;

    const query: any = { patientId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("workerId", "username email phone profilePicture role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.error("Get patient bookings error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: String(err),
    });
  }
}

// Get bookings for authenticated worker
export async function getWorkerBookings(req: Request, res: Response) {
  try {
    const workerId = (req as any).userId;

    const { status } = req.query;

    const query: any = { workerId };
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate("patientId", "username email phone")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.error("Get worker bookings error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: String(err),
    });
  }
}

// Get single booking by ID
export async function getBookingById(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const booking = await Booking.findById(id)
      .populate("patientId", "username email phone")
      .populate("workerId", "username email phone profilePicture role");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user has access (patient or worker)
    if (
      booking.patientId._id.toString() !== userId &&
      booking.workerId._id.toString() !== userId
    ) {
      // Check if user is admin or staff
      const user = await User.findById(userId);
      if (user?.role !== "Admin" && user?.role !== "Staff") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    return res.json({
      success: true,
      booking,
    });
  } catch (err) {
    console.error("Get booking error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: String(err),
    });
  }
}

// Update booking status (confirm, start, complete)
export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = ["confirmed", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check authorization
    const user = await User.findById(userId);
    const isWorker = booking.workerId.toString() === userId;
    const isAdmin = user?.role === "Admin" || user?.role === "Staff";

    // Only worker or admin can update status
    if (!isWorker && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only worker or admin can update booking status",
      });
    }

    // Status transition validation
    if (status === "confirmed" && booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only confirm pending bookings",
      });
    }

    if (status === "in_progress" && booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot change completed booking status",
      });
    }

    // Update status
    booking.status = status as any;

    if (status === "completed") {
      booking.completedAt = new Date();
    }

    if (notes) {
      booking.notes = notes;
    }

    await booking.save();

    await booking.populate("patientId", "username email phone");
    await booking.populate("workerId", "username email phone profilePicture role");

    return res.json({
      success: true,
      message: "Booking status updated",
      booking,
    });
  } catch (err) {
    console.error("Update booking status error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: String(err),
    });
  }
}

// Cancel booking
export async function cancelBooking(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const reason = req.body?.reason; // Handle optional body for DELETE requests

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if already cancelled or completed
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed booking",
      });
    }

    // Determine who is cancelling
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let cancelledBy: "patient" | "worker" | "admin";

    // Convert both to strings for comparison
    const patientIdStr = booking.patientId.toString();
    const workerIdStr = booking.workerId.toString();
    const userIdStr = userId.toString();

    if (patientIdStr === userIdStr) {
      cancelledBy = "patient";
    } else if (workerIdStr === userIdStr) {
      cancelledBy = "worker";
    } else if (user.role === "Admin" || user.role === "Staff") {
      cancelledBy = "admin";
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own bookings.",
      });
    }

    // Update booking
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelledBy = cancelledBy;
    if (reason) {
      booking.cancellationReason = reason;
    }

    await booking.save();

    await booking.populate("patientId", "username email phone");
    await booking.populate("workerId", "username email phone profilePicture role");

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: String(err),
    });
  }
}

// Get all bookings (Admin/Staff only)
export async function getAllBookings(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;

    // Check if user is admin or staff
    const user = await User.findById(userId);
    if (user?.role !== "Admin" && user?.role !== "Staff") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Staff only.",
      });
    }

    const { status, workerRole, patientId, workerId } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (workerRole) query.workerRole = workerRole;
    if (patientId) query.patientId = patientId;
    if (workerId) query.workerId = workerId;

    const bookings = await Booking.find(query)
      .populate("patientId", "username email phone")
      .populate("workerId", "username email phone profilePicture role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      bookings,
    });
  } catch (err) {
    console.error("Get all bookings error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: String(err),
    });
  }
}

