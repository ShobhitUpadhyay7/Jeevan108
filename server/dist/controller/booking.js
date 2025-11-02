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
exports.createBooking = createBooking;
exports.getPatientBookings = getPatientBookings;
exports.getWorkerBookings = getWorkerBookings;
exports.getBookingById = getBookingById;
exports.updateBookingStatus = updateBookingStatus;
exports.cancelBooking = cancelBooking;
exports.getAllBookings = getAllBookings;
const booking_1 = __importDefault(require("../model/booking"));
const nurse_1 = __importDefault(require("../model/user/nurse"));
const caretaker_1 = __importDefault(require("../model/user/caretaker"));
const compounder_1 = __importDefault(require("../model/user/compounder"));
const BaseModel_1 = __importDefault(require("../model/user/BaseModel"));
// Helper to get worker model by role
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
// Helper to check availability
function checkAvailability(workerId, startDate, endDate, startTime, endTime) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check for overlapping bookings
        const overlappingBookings = yield booking_1.default.find({
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
                if (bookingStart.toDateString() === startDate.toDateString() ||
                    bookingEnd.toDateString() === endDate.toDateString() ||
                    (startDate <= bookingEnd && endDate >= bookingStart)) {
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
                    if ((newStartMinutes >= bookingStartMinutes && newStartMinutes < bookingEndMinutes) ||
                        (newEndMinutes > bookingStartMinutes && newEndMinutes <= bookingEndMinutes) ||
                        (newStartMinutes <= bookingStartMinutes && newEndMinutes >= bookingEndMinutes)) {
                        return false; // Time overlap found
                    }
                }
            }
        }
        return true; // Available
    });
}
// Calculate total amount based on service type and duration
function calculateAmount(serviceType, duration, hourlyRate, dailyRate, weeklyRate) {
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
function createBooking(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const patientId = req.userId; // From JWT middleware
            const { workerId, workerRole, serviceType, startDate, endDate, startTime, endTime, duration, serviceAddress, patientName, patientPhone, notes, } = req.body;
            // Validate required fields (patientName and patientPhone can come from user profile if not provided)
            if (!workerId || !workerRole || !serviceType || !startDate || !endDate || !startTime || !endTime || !duration || !serviceAddress) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields",
                });
            }
            // Verify patient/user exists - check User model (Patient is a discriminator of User)
            const user = yield BaseModel_1.default.findById(patientId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }
            // Use user data as patient (User model includes Patient discriminator)
            const patient = user;
            // Auto-fill patientName and patientPhone from user profile if not provided
            const finalPatientName = patientName || patient.username || "";
            const finalPatientPhone = patientPhone || patient.phone || "";
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
            const worker = yield WorkerModel.findById(workerId);
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
            const isAvailable = yield checkAvailability(workerId, startDateTime, endDateTime, startTime, endTime);
            if (!isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: "Worker is not available for the selected time slot",
                });
            }
            // Calculate total amount
            const hourlyRate = worker.hourlyRate || 0;
            const dailyRate = worker.dailyRate || 0;
            const weeklyRate = worker.weeklyRate || 0;
            const totalAmount = calculateAmount(serviceType, duration, hourlyRate, dailyRate, weeklyRate);
            if (totalAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pricing configuration",
                });
            }
            // Create booking
            const booking = new booking_1.default({
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
            yield booking.save();
            // Populate references
            yield booking.populate("patientId", "username email phone");
            yield booking.populate("workerId", "username email phone profilePicture");
            return res.status(201).json({
                success: true,
                message: "Booking created successfully",
                booking,
            });
        }
        catch (err) {
            console.error("Create booking error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to create booking",
                error: String(err),
            });
        }
    });
}
// Get bookings for authenticated patient
function getPatientBookings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const patientId = req.userId;
            const { status } = req.query;
            const query = { patientId };
            if (status) {
                query.status = status;
            }
            const bookings = yield booking_1.default.find(query)
                .populate("workerId", "username email phone profilePicture role")
                .sort({ createdAt: -1 });
            return res.json({
                success: true,
                bookings,
            });
        }
        catch (err) {
            console.error("Get patient bookings error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch bookings",
                error: String(err),
            });
        }
    });
}
// Get bookings for authenticated worker
function getWorkerBookings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const workerId = req.userId;
            const { status } = req.query;
            const query = { workerId };
            if (status) {
                query.status = status;
            }
            const bookings = yield booking_1.default.find(query)
                .populate("patientId", "username email phone")
                .sort({ createdAt: -1 });
            return res.json({
                success: true,
                bookings,
            });
        }
        catch (err) {
            console.error("Get worker bookings error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch bookings",
                error: String(err),
            });
        }
    });
}
// Get single booking by ID
function getBookingById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const booking = yield booking_1.default.findById(id)
                .populate("patientId", "username email phone")
                .populate("workerId", "username email phone profilePicture role");
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }
            // Check if user has access (patient or worker)
            if (booking.patientId._id.toString() !== userId &&
                booking.workerId._id.toString() !== userId) {
                // Check if user is admin or staff
                const user = yield BaseModel_1.default.findById(userId);
                if ((user === null || user === void 0 ? void 0 : user.role) !== "Admin" && (user === null || user === void 0 ? void 0 : user.role) !== "Staff") {
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
        }
        catch (err) {
            console.error("Get booking error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch booking",
                error: String(err),
            });
        }
    });
}
// Update booking status (confirm, start, complete)
function updateBookingStatus(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
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
            const booking = yield booking_1.default.findById(id);
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    message: "Booking not found",
                });
            }
            // Check authorization
            const user = yield BaseModel_1.default.findById(userId);
            const isWorker = booking.workerId.toString() === userId;
            const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === "Admin" || (user === null || user === void 0 ? void 0 : user.role) === "Staff";
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
            // Allow completing from both "confirmed" and "in_progress" status
            if (status === "completed" && booking.status !== "confirmed" && booking.status !== "in_progress") {
                return res.status(400).json({
                    success: false,
                    message: "Can only complete confirmed or in-progress bookings",
                });
            }
            // Time-based validation: Check if service can be completed
            if (status === "completed") {
                const now = new Date();
                const endDate = new Date(booking.endDate);
                const [endHours, endMinutes] = booking.endTime.split(":").map(Number);
                endDate.setHours(endHours, endMinutes, 0, 0);
                if (now < endDate) {
                    return res.status(400).json({
                        success: false,
                        message: `Service can only be completed on or after ${endDate.toLocaleString()}`,
                    });
                }
            }
            // Update status
            booking.status = status;
            if (status === "completed") {
                booking.completedAt = new Date();
            }
            if (notes) {
                booking.notes = notes;
            }
            yield booking.save();
            yield booking.populate("patientId", "username email phone");
            yield booking.populate("workerId", "username email phone profilePicture role");
            return res.json({
                success: true,
                message: "Booking status updated",
                booking,
            });
        }
        catch (err) {
            console.error("Update booking status error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to update booking status",
                error: String(err),
            });
        }
    });
}
// Cancel booking
function cancelBooking(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const userId = req.userId;
            const { id } = req.params;
            const reason = (_a = req.body) === null || _a === void 0 ? void 0 : _a.reason; // Handle optional body for DELETE requests
            const booking = yield booking_1.default.findById(id);
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
            const user = yield BaseModel_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }
            let cancelledBy;
            // Convert both to strings for comparison
            const patientIdStr = booking.patientId.toString();
            const workerIdStr = booking.workerId.toString();
            const userIdStr = userId.toString();
            if (patientIdStr === userIdStr) {
                cancelledBy = "patient";
            }
            else if (workerIdStr === userIdStr) {
                cancelledBy = "worker";
            }
            else if (user.role === "Admin" || user.role === "Staff") {
                cancelledBy = "admin";
            }
            else {
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
            yield booking.save();
            yield booking.populate("patientId", "username email phone");
            yield booking.populate("workerId", "username email phone profilePicture role");
            return res.json({
                success: true,
                message: "Booking cancelled successfully",
                booking,
            });
        }
        catch (err) {
            console.error("Cancel booking error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to cancel booking",
                error: String(err),
            });
        }
    });
}
// Get all bookings (Admin/Staff only)
function getAllBookings(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = req.userId;
            // Check if user is admin or staff
            const user = yield BaseModel_1.default.findById(userId);
            if ((user === null || user === void 0 ? void 0 : user.role) !== "Admin" && (user === null || user === void 0 ? void 0 : user.role) !== "Staff") {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Admin or Staff only.",
                });
            }
            const { status, workerRole, patientId, workerId } = req.query;
            const query = {};
            if (status)
                query.status = status;
            if (workerRole)
                query.workerRole = workerRole;
            if (patientId)
                query.patientId = patientId;
            if (workerId)
                query.workerId = workerId;
            const bookings = yield booking_1.default.find(query)
                .populate("patientId", "username email phone")
                .populate("workerId", "username email phone profilePicture role")
                .sort({ createdAt: -1 });
            return res.json({
                success: true,
                bookings,
            });
        }
        catch (err) {
            console.error("Get all bookings error:", err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch bookings",
                error: String(err),
            });
        }
    });
}
