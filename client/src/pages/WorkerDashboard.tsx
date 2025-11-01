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
  createdAt?: string;
  updatedAt?: string;
};

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "earnings" | "profile">("overview");

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

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/admin/login");
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                  <div className="space-y-6">
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
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        To update your profile information, please contact the administrator.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
