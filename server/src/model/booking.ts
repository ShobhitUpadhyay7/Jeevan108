import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  // Who booked (Patient)
  patientId: mongoose.Types.ObjectId;
  
  // Who is providing the service (Worker)
  workerId: mongoose.Types.ObjectId;
  workerRole: "Nurse" | "Caretaker" | "Compounder";
  
  // Booking details
  serviceType: "hourly" | "daily" | "weekly"; // Service duration type
  startDate: Date;
  endDate: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  
  // Duration and pricing
  duration: number; // in hours or days depending on serviceType
  hourlyRate?: number;
  dailyRate?: number;
  totalAmount: number;
  
  // Service location
  serviceAddress: string;
  patientName: string;
  patientPhone: string;
  
  // Status tracking
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  
  // Payment reference
  paymentId?: mongoose.Types.ObjectId;
  paymentStatus: "pending" | "paid" | "refunded";
  
  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: "patient" | "worker" | "admin";
  cancellationReason?: string;
  
  // Completion
  completedAt?: Date;
  notes?: string; // Additional notes from patient or worker
  
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    workerRole: {
      type: String,
      enum: ["Nurse", "Caretaker", "Compounder"],
      required: true,
      index: true,
    },
    
    serviceType: {
      type: String,
      enum: ["hourly", "daily", "weekly"],
      required: true,
    },
    
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    
    endDate: {
      type: Date,
      required: true,
    },
    
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "startTime must be in HH:mm format",
      },
    },
    
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: "endTime must be in HH:mm format",
      },
    },
    
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    
    hourlyRate: {
      type: Number,
      min: 0,
    },
    
    dailyRate: {
      type: Number,
      min: 0,
    },
    
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    serviceAddress: {
      type: String,
      required: true,
    },
    
    patientName: {
      type: String,
      required: true,
    },
    
    patientPhone: {
      type: String,
      required: true,
    },
    
    status: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      index: true,
    },
    
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
      index: true,
    },
    
    cancelledAt: {
      type: Date,
    },
    
    cancelledBy: {
      type: String,
      enum: ["patient", "worker", "admin"],
    },
    
    cancellationReason: {
      type: String,
    },
    
    completedAt: {
      type: Date,
    },
    
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
bookingSchema.index({ patientId: 1, createdAt: -1 }); // Get bookings by patient
bookingSchema.index({ workerId: 1, createdAt: -1 }); // Get bookings by worker
bookingSchema.index({ workerId: 1, startDate: 1, status: 1 }); // Check availability
bookingSchema.index({ status: 1, createdAt: -1 }); // Get bookings by status

// Compound index for availability checking
bookingSchema.index({ workerId: 1, startDate: 1, endDate: 1, status: 1 });

export default mongoose.model<IBooking>("Booking", bookingSchema);

