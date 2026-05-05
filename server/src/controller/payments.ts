import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import Payment from "../model/payments";

function normalizeServiceType(role?: string): "Nurse" | "Caretaker" | "Compounder" | undefined {
  if (!role) return undefined;
  const normalized = role.trim().toLowerCase();
  if (normalized === "nurse") return "Nurse";
  if (normalized === "caretaker") return "Caretaker";
  if (normalized === "compounder") return "Compounder";
  return undefined;
}

// Lazy initialization of Razorpay to ensure env vars are loaded
function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim().replace(/^['"]|['"]$/g, "");
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim().replace(/^['"]|['"]$/g, "");

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file");
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// ✅ Create Razorpay order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount, paidTo, serviceType, serviceReference, description, platformCommission } = req.body;
    const userId = (req as any).userId; // From JWT middleware

    if (!amount || !paidTo) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount and paidTo (professional ID) are required" 
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(String(paidTo))) {
      return res.status(400).json({
        success: false,
        message: "Invalid professional ID",
      });
    }

    const normalizedServiceType = normalizeServiceType(serviceType);
    if (serviceType && !normalizedServiceType) {
      return res.status(400).json({
        success: false,
        message: "Invalid service type. Must be Nurse, Caretaker, or Compounder",
      });
    }

    // Calculate professional amount if commission is specified
    const professionalAmount = platformCommission 
      ? amount - (amount * platformCommission / 100)
      : amount;

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        paidBy: userId,
        paidTo: paidTo,
        serviceType: normalizedServiceType || "",
      },
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    await Payment.create({
      razorpay_order_id: order.id,
      amount,
      currency: order.currency,
      status: "created",
      paidBy: userId,
      paidTo,
      serviceType: normalizedServiceType,
      serviceReference,
      description,
      platformCommission,
      professionalAmount,
    });

    // Return order along with Razorpay key ID for frontend
    res.json({ 
      success: true, 
      order,
      keyId: process.env.RAZORPAY_KEY_ID // Safe to expose key ID
    });
  } catch (error) {
    console.error(error);
    const razorpayErrorDescription =
      (error as { error?: { description?: string } })?.error?.description;
    const message =
      razorpayErrorDescription ||
      (error instanceof Error ? error.message : "Error creating Razorpay order");
    res.status(500).json({
      success: false,
      message,
    });
  }
};

// ✅ Verify payment after success
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest("hex");

    const payment = await Payment.findOne({ razorpay_order_id });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (razorpay_signature === expectedSign) {
      payment.status = "paid";
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      await payment.save();

      // If payment has a serviceReference (booking ID), update booking payment status
      if (payment.serviceReference) {
        try {
          const Booking = (await import("../model/booking")).default;
          const booking = await Booking.findById(payment.serviceReference);
          if (booking) {
            booking.paymentId = payment._id as mongoose.Types.ObjectId;
            booking.paymentStatus = "paid";
            booking.status = "confirmed"; // Auto-confirm booking after payment
            await booking.save();
          }
        } catch (bookingError) {
          console.error("Error updating booking payment status:", bookingError);
          // Don't fail payment verification if booking update fails
        }
      }

      res.json({ success: true, message: "Payment verified successfully", payment });
    } else {
      payment.status = "failed";
      await payment.save();
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error verifying payment" });
  }
};
