import { useState, useEffect } from "react";
import { API_URLS } from "../../utils/api";

type Application = {
  _id: string;
  username: string;
  email: string;
  phone: string;
  role: "Nurse" | "Caretaker" | "Compounder";
  submittedAt: string;
  status?: "pending" | "approved" | "rejected";
  address?: string;
  profilePicture?: string;
  documents?: {
    governmentId?: string;
    nursingRegistrationCertificate?: string;
    trainingCertificate?: string;
    policeVerificationCertificate?: string;
  };
  rejectionReason?: string;
};

export default function ApplicationList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_URLS.adminApplications.list()}?status=pending`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = (await res.json()) as Application[];
      setApplications(data);
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplicationDetails(id: string) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.adminApplications.getById(id), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = (await res.json()) as Application;
      return data;
    } catch {
      return null;
    }
  }

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.adminApplications.approve(id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data?.message || "Failed to approve");
      }
      await fetchApplications();
      if (selectedApp?._id === id) setSelectedApp(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve application");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setProcessing(id);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.adminApplications.reject(id), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data?.message || "Failed to reject");
      }
      setShowRejectModal(false);
      setRejectReason("");
      await fetchApplications();
      if (selectedApp?._id === id) setSelectedApp(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setProcessing(null);
    }
  }

  async function toggleDetails(app: Application) {
    if (selectedApp?._id === app._id) {
      setSelectedApp(null);
      return;
    }
    const details = await fetchApplicationDetails(app._id);
    if (details) setSelectedApp(details);
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Nurse":
        return "bg-blue-100 text-blue-700";
      case "Compounder":
        return "bg-purple-100 text-purple-700";
      case "Caretaker":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-600">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Applications</h3>
            <p className="text-sm text-gray-500 mt-1">
              {applications.length} {applications.length === 1 ? "application" : "applications"} pending review
            </p>
          </div>
          <button
            onClick={fetchApplications}
            className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
          >
            Refresh
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending applications at this time.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map((app) => {
              const isExpanded = selectedApp?._id === app._id;
              const isProcessing = processing === app._id;
              return (
                <div key={app._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{app.username}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            app.role
                          )}`}
                        >
                          {app.role}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span> {app.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {app.phone}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium">Submitted:</span>{" "}
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleDetails(app)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && selectedApp && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {selectedApp.address && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Address:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedApp.address}</p>
                          </div>
                        )}
                        {selectedApp.profilePicture && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Profile Picture:</span>
                            <a
                              href={selectedApp.profilePicture}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:underline block mt-1"
                            >
                              View Image
                            </a>
                          </div>
                        )}
                      </div>

                      {selectedApp.documents && (
                        <div className="mb-4">
                          <span className="text-sm font-medium text-gray-700 block mb-2">Documents:</span>
                          <div className="space-y-2">
                            {selectedApp.documents.governmentId && (
                              <a
                                href={selectedApp.documents.governmentId}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-teal-600 hover:underline block"
                              >
                                Government ID
                              </a>
                            )}
                            {selectedApp.documents.nursingRegistrationCertificate && (
                              <a
                                href={selectedApp.documents.nursingRegistrationCertificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-teal-600 hover:underline block"
                              >
                                Nursing Registration Certificate
                              </a>
                            )}
                            {selectedApp.documents.trainingCertificate && (
                              <a
                                href={selectedApp.documents.trainingCertificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-teal-600 hover:underline block"
                              >
                                Training Certificate
                              </a>
                            )}
                            {selectedApp.documents.policeVerificationCertificate && (
                              <a
                                href={selectedApp.documents.policeVerificationCertificate}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-teal-600 hover:underline block"
                              >
                                Police Verification Certificate
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleApprove(app._id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium rounded-lg"
                        >
                          {isProcessing ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setShowRejectModal(true);
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reject {selectedApp.username}'s application? Please provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={4}
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedApp._id)}
                disabled={processing === selectedApp._id || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg"
              >
                {processing === selectedApp._id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
