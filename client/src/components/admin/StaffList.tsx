import { useState, useEffect, useCallback } from "react";
import { API_URLS } from "../../utils/api";
import AddressAutocomplete from "../AddressAutocomplete";

type Staff = {
  _id: string;
  username: string;
  email: string;
  phone: string;
  address?: string;
  profilePicture?: string;
};

export default function StaffList() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
    profilePicture: "",
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.staff.list(), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch staff");
      }
      const data = (await res.json()) as Staff[];
      setStaff(data);
    } catch {
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function fetchStaffDetails(id: string) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.staff.getById(id), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = (await res.json()) as Staff;
      return data;
    } catch {
      return null;
    }
  }

  async function toggleDetails(staffMember: Staff) {
    if (selectedStaff?._id === staffMember._id) {
      setSelectedStaff(null);
      return;
    }
    const details = await fetchStaffDetails(staffMember._id);
    if (details) setSelectedStaff(details);
  }

  // Convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  function openEditModal(staffMember: Staff) {
    setEditForm({
      username: staffMember.username || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      address: staffMember.address || "",
      profilePicture: staffMember.profilePicture || "",
    });
    setProfilePictureFile(null);
    setProfilePicturePreview("");
    setSelectedStaff(staffMember);
    setShowEditModal(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStaff) return;

    setProcessing(selectedStaff._id);
    try {
      // Process profile picture - use new file if uploaded, otherwise use existing URL
      let profilePictureToSend: string | undefined;
      if (profilePictureFile) {
        profilePictureToSend = await fileToBase64(profilePictureFile);
      } else if (editForm.profilePicture) {
        profilePictureToSend = editForm.profilePicture;
      }

      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.staff.updateById(selectedStaff._id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...editForm,
          profilePicture: profilePictureToSend,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data?.message || "Failed to update staff");
      }

      await fetchStaff();
      setShowEditModal(false);
      setSelectedStaff(null);
      setProfilePictureFile(null);
      setProfilePicturePreview("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update staff");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDelete() {
    if (!selectedStaff) return;

    setProcessing(selectedStaff._id);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.staff.deleteById(selectedStaff._id), {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) {
        let errorMessage = "Failed to delete staff";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = (await res.json()) as { message?: string };
            errorMessage = data?.message || `Delete failed with status ${res.status}`;
          } else {
            errorMessage = `Delete failed with status ${res.status}`;
          }
        } catch {
          errorMessage = `Delete failed with status ${res.status}`;
        }
        throw new Error(errorMessage);
      }

      await fetchStaff();
      setShowDeleteModal(false);
      setSelectedStaff(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete staff");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-600">Loading staff...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchStaff}
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
            <h3 className="text-lg font-semibold text-gray-900">Staff Management</h3>
            <p className="text-sm text-gray-500 mt-1">
              {staff.length} {staff.length === 1 ? "staff member" : "staff members"}
            </p>
          </div>
          <button
            onClick={fetchStaff}
            className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
          >
            Refresh
          </button>
        </div>

        {staff.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No staff members found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((staffMember) => {
              const isExpanded = selectedStaff?._id === staffMember._id;
              const isProcessing = processing === staffMember._id;
              return (
                <div key={staffMember._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{staffMember.username}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                          Staff
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span> {staffMember.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {staffMember.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleDetails(staffMember)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                      <button
                        onClick={() => openEditModal(staffMember)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStaff(staffMember);
                          setShowDeleteModal(true);
                        }}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {isExpanded && selectedStaff && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {selectedStaff.address && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Address:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedStaff.address}</p>
                          </div>
                        )}
                        {selectedStaff.profilePicture && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Profile Picture:</span>
                            <a
                              href={selectedStaff.profilePicture}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:underline block mt-1"
                            >
                              View Image
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Staff Member</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <AddressAutocomplete
                  value={editForm.address || ""}
                  onChange={(address) => setEditForm({ ...editForm, address })}
                  placeholder="Address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                {!profilePictureFile && editForm.profilePicture && (
                  <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current picture:</p>
                    <img
                      src={editForm.profilePicture}
                      alt="Current profile"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold text-teal-600 hover:text-teal-700">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File size must be less than 5MB");
                          return;
                        }
                        setProfilePictureFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfilePicturePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                {profilePicturePreview && profilePictureFile && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-teal-900">New picture: {profilePictureFile.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePictureFile(null);
                          setProfilePicturePreview("");
                        }}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <img
                      src={profilePicturePreview}
                      alt="New profile picture preview"
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedStaff(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing === selectedStaff._id}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium rounded-lg"
                >
                  {processing === selectedStaff._id ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Staff Member</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{selectedStaff.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={processing === selectedStaff._id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg"
              >
                {processing === selectedStaff._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

