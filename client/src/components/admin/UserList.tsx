import { useState, useEffect, useCallback } from "react";
import { API_URLS } from "../../utils/api";

type User = {
  _id: string;
  username: string;
  email: string;
  phone: string;
  role?: string;
  address?: string;
  profilePicture?: string;
};

type Role = "nurse" | "caretaker" | "compounder";

export default function UserList() {
  const [selectedRole, setSelectedRole] = useState<Role>("nurse");
  const [users, setUsers] = useState<User[]>([]);
  const [userCounts, setUserCounts] = useState<Record<Role, number>>({
    nurse: 0,
    caretaker: 0,
    compounder: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchAllCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const counts: Record<Role, number> = {
        nurse: 0,
        caretaker: 0,
        compounder: 0,
      };

      for (const role of ["nurse", "caretaker", "compounder"] as Role[]) {
        try {
          const res = await fetch(API_URLS.adminUsers.listByRole(role), {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          if (res.ok) {
            const data = (await res.json()) as User[];
            counts[role] = data.length;
          }
        } catch {
          // Ignore errors for counts
        }
      }

      setUserCounts(counts);
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.adminUsers.listByRole(selectedRole), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = (await res.json()) as User[];
      setUsers(data);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchUsers();
    fetchAllCounts();
  }, [fetchUsers, fetchAllCounts]);

  async function fetchUserDetails(id: string) {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.adminUsers.getByRoleAndId(selectedRole, id), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = (await res.json()) as User;
      return data;
    } catch {
      return null;
    }
  }

  async function handleDelete(id: string) {
    setProcessing(id);
    try {
      const token = localStorage.getItem("token") || "";
      const url = API_URLS.adminUsers.deleteByRoleAndId(selectedRole, id);
      console.log("Deleting user:", { url, role: selectedRole, id });
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      
      console.log("Delete response:", { status: res.status, ok: res.ok });
      
      if (!res.ok) {
        // Try to get error message if response has body
        let errorMessage = "Failed to delete user";
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
      
      // Success - 204 No Content or 200 OK
      await fetchUsers();
      await fetchAllCounts();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setProcessing(null);
    }
  }

  async function toggleDetails(user: User) {
    if (selectedUser?._id === user._id) {
      setSelectedUser(null);
      return;
    }
    const details = await fetchUserDetails(user._id);
    if (details) setSelectedUser(details);
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "nurse":
        return "bg-blue-100 text-blue-700";
      case "compounder":
        return "bg-purple-100 text-purple-700";
      case "caretaker":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const roleLabels: Record<Role, string> = {
    nurse: "Nurses",
    caretaker: "Caretakers",
    compounder: "Compounders",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchUsers}
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
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage healthcare professionals on the platform
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
            >
              Refresh
            </button>
          </div>

          {/* Role Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            {(["nurse", "caretaker", "compounder"] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setSelectedUser(null);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedRole === role
                    ? "text-teal-700 border-b-2 border-teal-500"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {roleLabels[role]} ({userCounts[role]})
              </button>
            ))}
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {roleLabels[selectedRole].toLowerCase()} found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => {
              const isExpanded = selectedUser?._id === user._id;
              const isProcessing = processing === user._id;
              return (
                <div key={user._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{user.username}</h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            selectedRole
                          )}`}
                        >
                          {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Email:</span> {user.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {user.phone}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleDetails(user)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        {isExpanded ? "Hide Details" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && selectedUser && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {selectedUser.address && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Address:</span>
                            <p className="text-sm text-gray-600 mt-1">{selectedUser.address}</p>
                          </div>
                        )}
                        {selectedUser.profilePicture && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Profile Picture:</span>
                            <a
                              href={selectedUser.profilePicture}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:underline block mt-1"
                            >
                              View Image
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg"
                        >
                          Delete User
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{selectedUser.username}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedUser._id)}
                disabled={processing === selectedUser._id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg"
              >
                {processing === selectedUser._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

