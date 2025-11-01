import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../utils/api";
import ReviewModal from "../components/ReviewModal";

type Booking = {
  _id: string;
  workerId: {
    _id: string;
    username: string;
    role: string;
    profilePicture?: string;
    phone: string;
  };
  serviceType: "hourly" | "daily" | "weekly";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  serviceAddress: string;
  patientName: string;
  patientPhone: string;
  notes?: string;
  cancelledAt?: string;
  cancelledBy?: "patient" | "worker" | "admin";
  cancellationReason?: string;
  completedAt?: string;
  createdAt: string;
};

export default function BookingStatus() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [bookingForReview, setBookingForReview] = useState<Booking | null>(null);
  const [existingReview, setExistingReview] = useState<{
    _id: string;
    rating: number;
    comment?: string;
  } | null>(null);
  const [bookingsWithReviews, setBookingsWithReviews] = useState<Record<string, {
    _id: string;
    rating: number;
    comment?: string;
  }>>({});

  const token = localStorage.getItem("token");

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const url = selectedStatus === "all" 
        ? API_URLS.bookings.getPatientBookings()
        : `${API_URLS.bookings.getPatientBookings()}?status=${selectedStatus}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await response.json();
      const bookingsData = data.bookings || [];
      setBookings(bookingsData);

      // Fetch reviews for completed bookings
      const completedBookings = bookingsData.filter((b: Booking) => b.status === "completed");
      const reviewsMap: Record<string, {
        _id: string;
        rating: number;
        comment?: string;
      }> = {};
      
      for (const booking of completedBookings) {
        try {
          const reviewResponse = await fetch(
            API_URLS.reviews.getBookingReview(booking._id),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const reviewData = await reviewResponse.json();
          if (reviewData.success && reviewData.review) {
            reviewsMap[booking._id] = reviewData.review;
          }
        } catch {
          // Ignore errors for individual review fetches
        }
      }
      
      setBookingsWithReviews(reviewsMap);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token, selectedStatus]);

  useEffect(() => {
    if (!token) {
      // Redirect to login if not authenticated
      navigate("/admin/login");
      return;
    }
    fetchBookings();
  }, [token, navigate, fetchBookings]);

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const response = await fetch(API_URLS.bookings.cancel(bookingId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      await fetchBookings();
      setShowDetailsModal(false);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  }

  function getStatusBadgeColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "completed":
        return "bg-green-100 text-green-800 border-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  function getStatusDisplayName(status: string): string {
    if (!status) return "Unknown";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const filteredBookings = selectedStatus === "all" 
    ? bookings 
    : bookings.filter((b) => b.status === selectedStatus);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="w-full min-h-screen bg-gray-50 py-12 px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              My <span className="text-teal-600">Bookings</span>
            </h1>
            <p className="text-lg text-gray-600">
              View and manage your service bookings
            </p>
          </div>

          {/* Status Filter */}
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {[
              { value: "all", label: "All Bookings" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ].map((filter) => {
              const count = filter.value === "all" 
                ? bookings.length 
                : bookings.filter((b) => b.status === filter.value).length;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                    selectedStatus === filter.value
                      ? "bg-teal-600 text-white shadow-lg"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {filter.label}
                  <span className="ml-2 text-sm opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Bookings List */}
          {error ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchBookings}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Retry
              </button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-600 mb-4">
                {selectedStatus === "all"
                  ? "You haven't made any bookings yet."
                  : `You don't have any ${selectedStatus} bookings.`}
              </p>
              <button
                onClick={() => navigate("/browse")}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
              >
                Browse Providers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {booking.workerId.profilePicture ? (
                        <img
                          src={booking.workerId.profilePicture}
                          alt={booking.workerId.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {booking.workerId.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900">{booking.workerId.username}</h3>
                        <p className="text-sm text-gray-600">{booking.workerId.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-4 py-2 rounded-full text-xs font-bold border-2 uppercase tracking-wide shadow-sm ${getStatusBadgeColor(
                          booking.status || "unknown"
                        )}`}
                        title={`Status: ${getStatusDisplayName(booking.status || "unknown")}`}
                      >
                        {getStatusDisplayName(booking.status || "unknown")}
                      </span>
                      {booking.paymentStatus && (
                        <span className="text-xs text-gray-500">
                          {booking.paymentStatus === "paid" ? "✓ Paid" : booking.paymentStatus === "pending" ? "⏳ Pending" : booking.paymentStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formatDate(booking.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="font-semibold text-teal-600">₹{booking.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </button>
                    {booking.status === "completed" && (
                      <button
                        onClick={() => {
                          const review = bookingsWithReviews[booking._id];
                          setExistingReview(review || null);
                          setBookingForReview(booking);
                          setShowReviewModal(true);
                        }}
                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold rounded-lg transition-colors text-sm"
                      >
                        {bookingsWithReviews[booking._id] ? "Edit Review" : "Leave Review"}
                      </button>
                    )}
                    {booking.status !== "cancelled" &&
                      booking.status !== "completed" &&
                      booking.status !== "in_progress" && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Worker Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  {selectedBooking.workerId.profilePicture ? (
                    <img
                      src={selectedBooking.workerId.profilePicture}
                      alt={selectedBooking.workerId.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {selectedBooking.workerId.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{selectedBooking.workerId.username}</h3>
                    <p className="text-gray-600">{selectedBooking.workerId.role}</p>
                    <p className="text-sm text-gray-500">{selectedBooking.workerId.phone}</p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Service Type</div>
                    <div className="font-semibold text-gray-900 capitalize">{selectedBooking.serviceType}</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2">Status</div>
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 uppercase tracking-wide ${getStatusBadgeColor(
                        selectedBooking.status || "unknown"
                      )}`}
                    >
                      {getStatusDisplayName(selectedBooking.status || "unknown")}
                    </span>
                    <div className="mt-2 text-xs text-gray-500">
                      Payment: <span className="font-semibold capitalize">{selectedBooking.paymentStatus || "pending"}</span>
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Start Date</div>
                    <div className="font-semibold text-gray-900">{formatDate(selectedBooking.startDate)}</div>
                    <div className="text-sm text-gray-600">{selectedBooking.startTime}</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">End Date</div>
                    <div className="font-semibold text-gray-900">{formatDate(selectedBooking.endDate)}</div>
                    <div className="text-sm text-gray-600">{selectedBooking.endTime}</div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Duration</div>
                    <div className="font-semibold text-gray-900">
                      {selectedBooking.duration}{" "}
                      {selectedBooking.serviceType === "hourly"
                        ? "Hours"
                        : selectedBooking.serviceType === "daily"
                        ? "Days"
                        : "Weeks"}
                    </div>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                    <div className="font-semibold text-teal-600 text-lg">
                      ₹{selectedBooking.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Payment: {selectedBooking.paymentStatus}</div>
                  </div>
                </div>

                {/* Patient Info */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Patient Information</div>
                  <div className="text-gray-900">Name: {selectedBooking.patientName}</div>
                  <div className="text-gray-900">Phone: {selectedBooking.patientPhone}</div>
                </div>

                {/* Service Address */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Service Address</div>
                  <div className="text-gray-900">{selectedBooking.serviceAddress}</div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                    <div className="text-gray-900">{selectedBooking.notes}</div>
                  </div>
                )}

                {/* Cancellation Info */}
                {selectedBooking.status === "cancelled" && selectedBooking.cancellationReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-medium text-red-700 mb-2">
                      Cancelled by: {selectedBooking.cancelledBy}
                    </div>
                    <div className="text-red-900">{selectedBooking.cancellationReason}</div>
                    {selectedBooking.cancelledAt && (
                      <div className="text-xs text-red-600 mt-1">
                        On: {formatDate(selectedBooking.cancelledAt)}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {selectedBooking.status === "completed" && (
                    <button
                      onClick={() => {
                        const review = bookingsWithReviews[selectedBooking._id];
                        setExistingReview(review || null);
                        setBookingForReview(selectedBooking);
                        setShowReviewModal(true);
                        setShowDetailsModal(false);
                      }}
                      className="px-6 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-semibold rounded-lg transition-colors"
                    >
                      {bookingsWithReviews[selectedBooking._id] ? "Edit Review" : "Leave a Review"}
                    </button>
                  )}
                  {selectedBooking.status !== "cancelled" &&
                    selectedBooking.status !== "completed" &&
                    selectedBooking.status !== "in_progress" && (
                      <button
                        onClick={() => {
                          handleCancelBooking(selectedBooking._id);
                        }}
                        className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="ml-auto px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && bookingForReview && (
        <ReviewModal
          bookingId={bookingForReview._id}
          workerName={bookingForReview.workerId.username}
          onClose={() => {
            setShowReviewModal(false);
            setBookingForReview(null);
            setExistingReview(null);
          }}
          onSuccess={() => {
            fetchBookings();
            // Refresh the page to update ratings on worker cards
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }}
          existingReview={existingReview || undefined}
        />
      )}
    </>
  );
}

