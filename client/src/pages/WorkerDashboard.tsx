import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../utils/api";

type WorkerProfile = {
  _id: string;
  username: string;
  email: string;
  phone: string;
  address?: string;
  profilePicture?: string;
  role: string;
  governmentId?: string;
  nursingRegistrationCertificate?: string;
  trainingCertificate?: string;
  policeVerificationCertificate?: string;
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "bookings" | "earnings" | "profile">("overview");
  
  type Booking = {
    _id: string;
    patientId?: { username?: string; email?: string; phone?: string };
    serviceType: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    totalAmount: number;
    status: string;
    serviceAddress: string;
  };
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    hourlyRate: 0,
    dailyRate: 0,
    weeklyRate: 0,
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Fetch user profile (me endpoint now returns full profile for workers)
    fetch(API_URLS.auth.me(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch user info");
        return r.json();
      })
      .then((profile: WorkerProfile) => {
        // Check if user is a worker
        const workerRoles = ["Nurse", "Caretaker", "Compounder"];
        if (!profile.role || !workerRoles.includes(profile.role)) {
          navigate("/");
          return;
        }
        setWorkerProfile(profile);
      })
      .catch((err) => {
        console.error("Error loading dashboard:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchWorkerBookings();
    }
  }, [activeTab]);

  async function fetchWorkerBookings() {
    const token = localStorage.getItem("token");
    if (!token) return;

    setBookingsLoading(true);
    try {
      const response = await fetch(API_URLS.bookings.getWorkerBookings(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(API_URLS.bookings.updateStatus(bookingId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update booking status");
      await fetchWorkerBookings();
    } catch (err) {
      console.error("Error updating booking:", err);
      alert(err instanceof Error ? err.message : "Failed to update booking");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  function startEditing() {
    if (workerProfile) {
      setEditForm({
        username: workerProfile.username || "",
        email: workerProfile.email || "",
        phone: workerProfile.phone || "",
        address: workerProfile.address || "",
        hourlyRate: workerProfile.hourlyRate || 0,
        dailyRate: workerProfile.dailyRate || 0,
        weeklyRate: workerProfile.weeklyRate || 0,
      });
      setProfilePicturePreview(workerProfile.profilePicture || "");
      setIsEditingProfile(true);
    }
  }

  function cancelEditing() {
    setIsEditingProfile(false);
    setProfilePictureFile(null);
    setProfilePicturePreview("");
  }

  function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Profile picture must be less than 5MB");
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeProfilePicture() {
    setProfilePictureFile(null);
    setProfilePicturePreview("");
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdatingProfile(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      // Process profile picture - use new file if uploaded, otherwise use existing URL
      let profilePictureToSend: string | undefined;
      if (profilePictureFile) {
        profilePictureToSend = await fileToBase64(profilePictureFile);
      } else if (profilePicturePreview && profilePicturePreview.startsWith("http")) {
        profilePictureToSend = profilePicturePreview;
      }

      const response = await fetch(API_URLS.auth.me(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editForm,
          profilePicture: profilePictureToSend,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedProfile = await response.json();
      setWorkerProfile(updatedProfile);
      setIsEditingProfile(false);
      setProfilePictureFile(null);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      alert(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  }

  function getRoleDisplayName(role?: string): string {
    switch (role) {
      case "Nurse":
        return "Registered Nurse";
      case "Caretaker":
        return "Caretaker";
      case "Compounder":
        return "Compounder";
      default:
        return role || "Worker";
    }
  }

  function getDocumentName(key: string): string {
    switch (key) {
      case "governmentId":
        return "Government ID";
      case "nursingRegistrationCertificate":
        return "Nursing Registration Certificate";
      case "trainingCertificate":
        return "Training Certificate";
      case "policeVerificationCertificate":
        return "Police Verification Certificate";
      default:
        return key;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/admin/login")}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm fixed left-0 top-0 pt-16">
        <div className="p-4">
          <div className="mb-8 px-3">
            <h2 className="text-xl font-extrabold text-gray-900">Worker Portal</h2>
            <p className="text-sm text-gray-500 mt-1">Jeevan 108</p>
          </div>
          <nav className="space-y-1">
            {[
              { label: "Overview", tab: "overview" as const },
              { label: "Documents", tab: "documents" as const },
              { label: "Bookings", tab: "bookings" as const },
              { label: "Earnings", tab: "earnings" as const },
              { label: "Profile", tab: "profile" as const },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.tab
                    ? "bg-teal-50 text-teal-700 font-semibold border-l-4 border-teal-500"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 px-4">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <section className="w-full min-h-screen py-8">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {getRoleDisplayName(workerProfile?.role)} Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Welcome{workerProfile?.username ? `, ${workerProfile.username}` : ""}
                  </p>
                </div>
                {workerProfile?.profilePicture && (
                  <img
                    src={workerProfile.profilePicture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-2 border-teal-500 object-cover"
                  />
                )}
              </div>
            </div>

            {/* Content based on active tab */}
            <div className="grid grid-cols-1 gap-6">
              {activeTab === "overview" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <h3 className="text-sm font-medium text-teal-900 mb-1">Role</h3>
                      <p className="text-lg font-semibold text-teal-700">
                        {getRoleDisplayName(workerProfile?.role)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-medium text-blue-900 mb-1">Email</h3>
                      <p className="text-lg font-semibold text-blue-700">{workerProfile?.email}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="text-sm font-medium text-purple-900 mb-1">Phone</h3>
                      <p className="text-lg font-semibold text-purple-700">{workerProfile?.phone}</p>
                    </div>
                    {workerProfile?.address && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Address</h3>
                        <p className="text-lg font-semibold text-gray-700">{workerProfile.address}</p>
                      </div>
                    )}
                  </div>
                  {workerProfile?.createdAt && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Member since: {new Date(workerProfile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "documents" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents & Certificates</h2>
                  <div className="space-y-4">
                    {workerProfile &&
                      Object.entries(workerProfile)
                        .filter(([key]) =>
                          [
                            "governmentId",
                            "nursingRegistrationCertificate",
                            "trainingCertificate",
                            "policeVerificationCertificate",
                          ].includes(key)
                        )
                        .filter(([, value]) => value)
                        .map(([key, url]) => (
                          <div key={key} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {getDocumentName(key)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Certificate Document</p>
                              </div>
                              <a
                                href={url as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                    {workerProfile &&
                      Object.entries(workerProfile)
                        .filter(([key]) =>
                          [
                            "governmentId",
                            "nursingRegistrationCertificate",
                            "trainingCertificate",
                            "policeVerificationCertificate",
                          ].includes(key)
                        )
                        .filter(([, value]) => value).length === 0 && (
                        <p className="text-gray-500 text-center py-8">No documents available</p>
                      )}
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">My Bookings</h2>
                  {bookingsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
                      <p className="text-gray-600">Loading bookings...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No bookings found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {booking.patientId?.username || "Patient"}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.startDate).toLocaleDateString()} - {booking.startTime} to {booking.endTime}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : booking.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : booking.status === "in_progress"
                                  ? "bg-purple-100 text-purple-800"
                                  : booking.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booking.status.replace("_", " ").toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            <p>Service: {booking.serviceType} ({booking.duration} {booking.serviceType === "hourly" ? "hours" : booking.serviceType === "daily" ? "days" : "weeks"})</p>
                            <p>Address: {booking.serviceAddress}</p>
                            <p className="font-semibold text-teal-600 mt-1">Amount: ₹{booking.totalAmount.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            {booking.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking._id, "confirmed")}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to cancel this booking?")) {
                                      try {
                                        const token = localStorage.getItem("token");
                                        if (!token) {
                                          alert("Please login again");
                                          return;
                                        }

                                        const url = API_URLS.bookings.cancel(booking._id);
                                        console.log("Cancelling booking:", booking._id, "URL:", url);

                                        const response = await fetch(url, {
                                          method: "DELETE",
                                          headers: { 
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                          },
                                        });

                                        console.log("Response status:", response.status);

                                        // Try to parse response as JSON, but handle if it's not
                                        let data;
                                        const contentType = response.headers.get("content-type");
                                        if (contentType && contentType.includes("application/json")) {
                                          data = await response.json();
                                        } else {
                                          const text = await response.text();
                                          console.error("Non-JSON response:", text);
                                          throw new Error(`Server returned: ${text || response.statusText}`);
                                        }

                                        if (!response.ok) {
                                          console.error("Error response:", data);
                                          throw new Error(data.message || data.error || `Failed to cancel booking (${response.status})`);
                                        }

                                        alert("Booking cancelled successfully");
                                        fetchWorkerBookings();
                                      } catch (err) {
                                        console.error("Cancel booking error:", err);
                                        const errorMessage = err instanceof Error ? err.message : "Failed to cancel booking. Please check console for details.";
                                        alert(errorMessage);
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking._id, "in_progress")}
                                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                  Start Service
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to cancel this booking?")) {
                                      try {
                                        const token = localStorage.getItem("token");
                                        if (!token) {
                                          alert("Please login again");
                                          return;
                                        }

                                        const url = API_URLS.bookings.cancel(booking._id);
                                        console.log("Cancelling booking:", booking._id, "URL:", url);

                                        const response = await fetch(url, {
                                          method: "DELETE",
                                          headers: { 
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                          },
                                        });

                                        console.log("Response status:", response.status);

                                        // Try to parse response as JSON, but handle if it's not
                                        let data;
                                        const contentType = response.headers.get("content-type");
                                        if (contentType && contentType.includes("application/json")) {
                                          data = await response.json();
                                        } else {
                                          const text = await response.text();
                                          console.error("Non-JSON response:", text);
                                          throw new Error(`Server returned: ${text || response.statusText}`);
                                        }

                                        if (!response.ok) {
                                          console.error("Error response:", data);
                                          throw new Error(data.message || data.error || `Failed to cancel booking (${response.status})`);
                                        }

                                        alert("Booking cancelled successfully");
                                        fetchWorkerBookings();
                                      } catch (err) {
                                        console.error("Cancel booking error:", err);
                                        const errorMessage = err instanceof Error ? err.message : "Failed to cancel booking. Please check console for details.";
                                        alert(errorMessage);
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === "in_progress" && (
                              <>
                                <button
                                  onClick={() => updateBookingStatus(booking._id, "completed")}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                  Complete Service
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
                                      try {
                                        const response = await fetch(API_URLS.bookings.cancel(booking._id), {
                                          method: "DELETE",
                                          headers: { 
                                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                                            "Content-Type": "application/json",
                                          },
                                        });

                                        const data = await response.json();

                                        if (!response.ok) {
                                          throw new Error(data.message || "Failed to cancel booking");
                                        }

                                        alert("Booking cancelled successfully");
                                        fetchWorkerBookings();
                                      } catch (err) {
                                        console.error("Cancel booking error:", err);
                                        alert(err instanceof Error ? err.message : "Failed to cancel booking");
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-lg transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "earnings" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Earnings & Payments</h2>
                  <div className="text-center py-12">
                    <div className="inline-block p-6 bg-teal-50 rounded-full mb-4">
                      <svg
                        className="w-16 h-16 text-teal-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-2">Payment history and earnings will appear here</p>
                    <p className="text-sm text-gray-500">
                      This feature is coming soon. Your payment records will be displayed once bookings are active.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    {!isEditingProfile && (
                      <button
                        onClick={startEditing}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {!isEditingProfile ? (
                    // View Mode
                    <div className="space-y-6">
                      {workerProfile?.profilePicture && (
                        <div className="flex justify-center mb-6">
                          <img
                            src={workerProfile.profilePicture}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover border-4 border-teal-500"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <p className="text-gray-900">{workerProfile?.username || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-gray-900">{workerProfile?.email || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <p className="text-gray-900">{workerProfile?.phone || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <p className="text-gray-900">{getRoleDisplayName(workerProfile?.role)}</p>
                        </div>
                        {workerProfile?.address && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <p className="text-gray-900">{workerProfile.address}</p>
                          </div>
                        )}
                        {workerProfile?.hourlyRate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                            <p className="text-gray-900 font-semibold text-teal-600">₹{workerProfile.hourlyRate}/hour</p>
                          </div>
                        )}
                        {workerProfile?.dailyRate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate</label>
                            <p className="text-gray-900 font-semibold text-teal-600">₹{workerProfile.dailyRate}/day</p>
                          </div>
                        )}
                        {workerProfile?.weeklyRate && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate</label>
                            <p className="text-gray-900 font-semibold text-teal-600">₹{workerProfile.weeklyRate}/week</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      {/* Profile Picture */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                        {profilePicturePreview ? (
                          <div className="flex items-center gap-4">
                            <img
                              src={profilePicturePreview}
                              alt="Profile preview"
                              className="w-24 h-24 rounded-full object-cover border-2 border-teal-400"
                            />
                            <div className="flex gap-2">
                              <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors text-sm">
                                Change
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleProfilePictureChange}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={removeProfilePicture}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm text-gray-700">Upload Photo</span>
                            <input type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <p className="text-gray-600 py-2">{getRoleDisplayName(workerProfile?.role)}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          />
                        </div>
                      </div>

                      {/* Pricing Section */}
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (₹) *</label>
                            <input
                              type="number"
                              value={editForm.hourlyRate}
                              onChange={(e) => setEditForm({ ...editForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                              required
                              min="0"
                              step="10"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (₹) *</label>
                            <input
                              type="number"
                              value={editForm.dailyRate}
                              onChange={(e) => setEditForm({ ...editForm, dailyRate: parseFloat(e.target.value) || 0 })}
                              required
                              min="0"
                              step="50"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (₹) *</label>
                            <input
                              type="number"
                              value={editForm.weeklyRate}
                              onChange={(e) => setEditForm({ ...editForm, weeklyRate: parseFloat(e.target.value) || 0 })}
                              required
                              min="0"
                              step="100"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          disabled={updatingProfile}
                          className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                        >
                          {updatingProfile ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={updatingProfile}
                          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
