import { useState, useEffect, useCallback } from "react";
import WorkerCard from "../components/WorkerCard";
import BookingForm from "../components/BookingForm";
import { API_URLS } from "../utils/api";
import FindWithAI from "../components/FindWithAI";
import StarRating from "../components/StarRating";

type Worker = {
  _id: string;
  username: string;
  phone: string;
  address?: string;
  profilePicture?: string;
  role: string;
  createdAt?: string;
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
  isAvailable?: boolean;
  averageRating?: number;
  reviewCount?: number;
};

type Review = {
  _id: string;
  rating: number;
  comment?: string;
  patientId: {
    username: string;
  };
  createdAt: string;
};

type RoleFilter = "all" | "Nurse" | "Caretaker" | "Compounder";

export default function BrowseProviders() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [workerToBook, setWorkerToBook] = useState<Worker | null>(null);
  const [workerReviews, setWorkerReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiRecommendedWorkers, setAIRecommendedWorkers] = useState<Worker[]>([]);
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiReasoning, setAIReasoning] = useState<string>("");

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URLS.publicWorkers.listAll());
      if (!res.ok) {
        throw new Error("Failed to fetch workers");
      }
      const data = (await res.json()) as Worker[];
      setWorkers(data);
      setFilteredWorkers(data);
    } catch (err) {
      console.error("Error fetching workers:", err);
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  useEffect(() => {
    if (selectedRole === "all") {
      setFilteredWorkers(workers);
    } else {
      setFilteredWorkers(workers.filter((w) => w.role === selectedRole));
    }
  }, [selectedRole, workers]);

  async function handleWorkerClick(worker: Worker) {
    setSelectedWorker(worker);
    setShowDetailsModal(true);
    
    // Fetch reviews for this worker
    setLoadingReviews(true);
    try {
      const response = await fetch(API_URLS.reviews.getWorkerReviews(worker._id));
      const data = await response.json();
      if (data.success) {
        setWorkerReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setWorkerReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }

  function handleBookNow(worker: Worker) {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to book a service");
      // Optionally redirect to login
      return;
    }
    setWorkerToBook(worker);
    setShowBookingModal(true);
  }

  function handleBookingSuccess() {
    setShowBookingModal(false);
    setWorkerToBook(null);
    alert("Booking created successfully! Check your bookings from the navbar.");
    // Optionally navigate to bookings page
  }

  function handleAIRecommend(recommendedWorkers: Worker[], reasoning: string) {
    setAIRecommendedWorkers(recommendedWorkers);
    setAIReasoning(reasoning);
    setIsAIMode(true);
    setFilteredWorkers(recommendedWorkers);
    setShowAIAssistant(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleResetFilters() {
    setIsAIMode(false);
    setAIRecommendedWorkers([]);
    setAIReasoning("");
    setSelectedRole("all");
    setFilteredWorkers(workers);
  }

  function getRoleCount(role: RoleFilter): number {
    if (role === "all") return workers.length;
    return workers.filter((w) => w.role === role).length;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <button
            onClick={fetchWorkers}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className={`w-full min-h-screen bg-gray-50 py-12 px-4 md:px-6 relative ${showAIAssistant ? "md:mr-96" : ""} transition-all duration-300`}>
        {/* AI Assistant Button - Fixed on Right Side */}
        {!showAIAssistant && (
          <button
            onClick={() => setShowAIAssistant(true)}
            className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-semibold animate-pulse hover:animate-none"
          >
            <span className="text-2xl">🤖</span>
            <span>Find with AI</span>
          </button>
        )}

        <div className="mx-auto max-w-7xl">
          {/* AI Mode Banner */}
          {isAIMode && (
            <div className="mb-6 bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-teal-600 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">✨</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 mb-1">
                      AI Recommendations ({aiRecommendedWorkers.length} providers found)
                    </p>
                    <p className="text-sm text-gray-600">{aiReasoning}</p>
                  </div>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Browse <span className="text-teal-600">Healthcare Providers</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find qualified nurses, caretakers, and compounders to meet your healthcare needs
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="mb-8 flex flex-wrap justify-center gap-3">
            {[
              { key: "all" as RoleFilter, label: "All Providers" },
              { key: "Nurse" as RoleFilter, label: "Nurses" },
              { key: "Caretaker" as RoleFilter, label: "Caretakers" },
              { key: "Compounder" as RoleFilter, label: "Compounders" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedRole(filter.key)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                  selectedRole === filter.key
                    ? "bg-teal-600 text-white shadow-lg scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {filter.label}
                <span className="ml-2 text-sm opacity-75">
                  ({getRoleCount(filter.key)})
                </span>
              </button>
            ))}
          </div>

          {/* Workers Grid */}
          {filteredWorkers.length === 0 ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No providers found
              </h3>
              <p className="text-gray-600">
                {selectedRole === "all"
                  ? "There are no healthcare providers available at the moment."
                  : `No ${selectedRole.toLowerCase()}s are available at the moment.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredWorkers.map((worker) => (
                <WorkerCard
                  key={worker._id}
                  worker={worker}
                  onClick={() => handleWorkerClick(worker)}
                  onBookNow={() => handleBookNow(worker)}
                />
              ))}
            </div>
          )}

          {/* Stats Section */}
          {workers.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-teal-600 mb-2">
                  {getRoleCount("Nurse")}
                </div>
                <div className="text-gray-600 font-medium">Registered Nurses</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {getRoleCount("Caretaker")}
                </div>
                <div className="text-gray-600 font-medium">Caretakers</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {getRoleCount("Compounder")}
                </div>
                <div className="text-gray-600 font-medium">Compounders</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Details Modal */}
      {showDetailsModal && selectedWorker && (
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
                <h2 className="text-2xl font-bold text-gray-900">Provider Details</h2>
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

              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {selectedWorker.profilePicture ? (
                  <img
                    src={selectedWorker.profilePicture}
                    alt={selectedWorker.username}
                    className="w-32 h-32 rounded-full object-cover border-4 border-teal-500 mx-auto md:mx-0"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-teal-500 flex items-center justify-center border-4 border-teal-500 mx-auto md:mx-0">
                    <span className="text-white text-5xl font-bold">
                      {selectedWorker.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {selectedWorker.username}
                    </h3>
                    {(selectedWorker.averageRating || 0) > 0 && (
                      <div className="flex flex-col items-end">
                        <StarRating
                          rating={selectedWorker.averageRating || 0}
                          size="md"
                          showNumber
                        />
                        <span className="text-sm text-gray-500 mt-1">
                          {selectedWorker.reviewCount || 0} {selectedWorker.reviewCount === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-700 mb-4">
                    {selectedWorker.role === "Nurse"
                      ? "Registered Nurse"
                      : selectedWorker.role}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <svg
                        className="w-5 h-5 mr-3 text-teal-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span>{selectedWorker.phone}</span>
                    </div>

                    {selectedWorker.address && (
                      <div className="flex items-start text-gray-700">
                        <svg
                          className="w-5 h-5 mr-3 text-teal-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{selectedWorker.address}</span>
                      </div>
                    )}

                    {selectedWorker.createdAt && (
                      <div className="flex items-center text-gray-700">
                        <svg
                          className="w-5 h-5 mr-3 text-teal-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          Member since {new Date(selectedWorker.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              {(selectedWorker.hourlyRate || selectedWorker.dailyRate || selectedWorker.weeklyRate) && (
                <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedWorker.hourlyRate && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">₹{selectedWorker.hourlyRate}</div>
                        <div className="text-sm text-gray-600">per hour</div>
                      </div>
                    )}
                    {selectedWorker.dailyRate && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">₹{selectedWorker.dailyRate}</div>
                        <div className="text-sm text-gray-600">per day</div>
                      </div>
                    )}
                    {selectedWorker.weeklyRate && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-teal-600">₹{selectedWorker.weeklyRate}</div>
                        <div className="text-sm text-gray-600">per week</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Reviews ({selectedWorker.reviewCount || 0})
                </h3>
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <p className="text-gray-600 mt-2">Loading reviews...</p>
                  </div>
                ) : workerReviews.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {workerReviews.map((review) => (
                      <div
                        key={review._id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.patientId?.username || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const token = localStorage.getItem("token");
                    if (!token) {
                      alert("Please login to book a service");
                      return;
                    }
                    setShowDetailsModal(false);
                    handleBookNow(selectedWorker);
                  }}
                  className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Book Now
                </button>
                <button
                  onClick={() => {
                    window.location.href = `tel:${selectedWorker.phone}`;
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Contact
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && workerToBook && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowBookingModal(false);
            setWorkerToBook(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Book Service</h2>
                  <p className="text-gray-600 mt-1">
                    Booking with <span className="font-semibold">{workerToBook.username}</span> ({workerToBook.role})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setWorkerToBook(null);
                  }}
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

              <BookingForm
                worker={workerToBook}
                onSuccess={handleBookingSuccess}
                onCancel={() => {
                  setShowBookingModal(false);
                  setWorkerToBook(null);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <FindWithAI
          workers={workers}
          onRecommend={handleAIRecommend}
          onClose={() => setShowAIAssistant(false)}
        />
      )}
    </>
  );
}


