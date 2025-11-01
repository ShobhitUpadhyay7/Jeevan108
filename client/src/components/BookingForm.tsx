import { useState, useEffect } from "react";
import { API_URLS } from "../utils/api";
import AddressAutocomplete from "./AddressAutocomplete";

type Worker = {
  _id: string;
  username: string;
  role: string;
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
};

type BookingFormProps = {
  worker: Worker;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export default function BookingForm({ worker, onSuccess, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    serviceType: "hourly" as "hourly" | "daily" | "weekly",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
    duration: 8,
    serviceAddress: "",
    patientName: "",
    patientPhone: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [userProfile, setUserProfile] = useState<{ username?: string; email?: string; phone?: string; address?: string } | null>(null);

  // Fetch user profile on mount to auto-fill patient details
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(API_URLS.auth.me(), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((profile) => {
          setUserProfile(profile);
          // Auto-fill patient details from profile
          setFormData((prev) => ({
            ...prev,
            patientName: prev.patientName || profile.username || "",
            patientPhone: prev.patientPhone || profile.phone || "",
            serviceAddress: prev.serviceAddress || profile.address || "",
          }));
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
        });
    }
  }, []);

  // Calculate total amount when form changes
  useEffect(() => {
    let amount = 0;
    switch (formData.serviceType) {
      case "hourly":
        amount = (worker.hourlyRate || 0) * formData.duration;
        break;
      case "daily":
        amount = (worker.dailyRate || 0) * formData.duration;
        break;
      case "weekly":
        amount = (worker.weeklyRate || 0) * formData.duration;
        break;
    }
    setTotalAmount(amount);
  }, [formData.serviceType, formData.duration, worker]);

  // Set end date same as start date by default
  useEffect(() => {
    if (formData.startDate && !formData.endDate) {
      setFormData((prev) => ({ ...prev, endDate: formData.startDate }));
    }
  }, [formData.startDate, formData.endDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login to book a service");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create booking first (with pending payment status)
      const bookingResponse = await fetch(API_URLS.bookings.create(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workerId: worker._id,
          workerRole: worker.role,
          ...formData,
        }),
      });

      const bookingData = await bookingResponse.json();

      if (!bookingResponse.ok) {
        throw new Error(bookingData.message || "Failed to create booking");
      }

      const bookingId = bookingData.booking._id;

      // Step 2: Create Razorpay order
      const orderResponse = await fetch(API_URLS.payments.createOrder(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          paidTo: worker._id,
          serviceType: worker.role,
          serviceReference: bookingId,
          description: `Booking for ${worker.role} - ${formData.serviceType} service`,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // Step 3: Initialize Razorpay checkout
      if (!orderData.keyId) {
        throw new Error("Razorpay key not configured");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount, // Amount in paise
        currency: orderData.order.currency,
        name: "Jeevan 108",
        description: `Booking for ${worker.role} service`,
        order_id: orderData.order.id,
        prefill: {
          name: formData.patientName,
          email: userProfile?.email || "",
          contact: formData.patientPhone,
        },
        theme: {
          color: "#14b8a6", // teal-500
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          // Payment success - verify payment
          try {
            const verifyResponse = await fetch(API_URLS.payments.verify(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              // Payment verified successfully - booking is now confirmed
              setLoading(false);
              alert("Payment successful! Your booking has been confirmed.");
              if (onSuccess) {
                onSuccess();
              }
            } else {
              setError(verifyData.message || "Payment verification failed");
              setLoading(false);
            }
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            setError("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the payment modal
            setLoading(false);
            setError("Payment cancelled");
          },
        },
      };

      // Type declaration for Razorpay
      interface RazorpayInstance {
        open(): void;
      }

      interface RazorpayConstructor {
        new (options: unknown): RazorpayInstance;
      }

      interface WindowWithRazorpay extends Window {
        Razorpay: RazorpayConstructor;
      }

      // Check if Razorpay is loaded
      const windowWithRazorpay = window as unknown as WindowWithRazorpay;
      if (typeof windowWithRazorpay.Razorpay === "undefined") {
        throw new Error("Razorpay SDK not loaded. Please refresh the page.");
      }

      const Razorpay = windowWithRazorpay.Razorpay;
      const razorpay = new Razorpay(options);
      razorpay.open();

      // Keep loading state until payment is complete or cancelled
    } catch (err) {
      console.error("Booking error:", err);
      setError(err instanceof Error ? err.message : "Failed to create booking");
      setLoading(false);
    }
  }

  function getMinDate(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Service Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "hourly", label: "Hourly", rate: worker.hourlyRate },
            { value: "daily", label: "Daily", rate: worker.dailyRate },
            { value: "weekly", label: "Weekly", rate: worker.weeklyRate },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  serviceType: type.value as "hourly" | "daily" | "weekly",
                  duration: type.value === "hourly" ? 8 : type.value === "daily" ? 1 : 1,
                }))
              }
              className={`p-3 rounded-lg border-2 transition-all ${
                formData.serviceType === type.value
                  ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium">{type.label}</div>
              <div className="text-xs text-gray-500">
                ₹{type.rate || 0}/{type.value === "hourly" ? "hr" : type.value === "daily" ? "day" : "week"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            required
            min={getMinDate()}
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="date"
            required
            min={formData.startDate || getMinDate()}
            value={formData.endDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time *
          </label>
          <input
            type="time"
            required
            value={formData.startTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startTime: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time *
          </label>
          <input
            type="time"
            required
            value={formData.endTime}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, endTime: e.target.value }))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Duration ({formData.serviceType === "hourly" ? "Hours" : formData.serviceType === "daily" ? "Days" : "Weeks"}) *
        </label>
        <input
          type="number"
          required
          min="1"
          value={formData.duration}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 1 }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Patient Details - Auto-filled from profile if logged in */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Patient Name *
        </label>
        <input
          type="text"
          required
          value={formData.patientName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, patientName: e.target.value }))
          }
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${userProfile ? "bg-gray-50" : ""}`}
        />
        {userProfile && (
          <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Patient Phone *
        </label>
        <input
          type="tel"
          required
          value={formData.patientPhone}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, patientPhone: e.target.value }))
          }
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${userProfile ? "bg-gray-50" : ""}`}
        />
        {userProfile && (
          <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Address *
        </label>
        <AddressAutocomplete
          value={formData.serviceAddress}
          onChange={(address) =>
            setFormData((prev) => ({ ...prev, serviceAddress: address }))
          }
          placeholder="Enter the address where service will be provided"
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${userProfile ? "bg-gray-50" : ""}`}
          required
          rows={3}
        />
        {userProfile && formData.serviceAddress && (
          <p className="text-xs text-gray-500 mt-1">Auto-filled from your profile</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes (Optional)
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder="Any special instructions or requirements"
        />
      </div>

      {/* Total Amount */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
          <span className="text-2xl font-bold text-teal-700">₹{totalAmount.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Payment required to confirm booking. You will be redirected to Razorpay checkout.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? "Processing..." : "Proceed to Payment"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

