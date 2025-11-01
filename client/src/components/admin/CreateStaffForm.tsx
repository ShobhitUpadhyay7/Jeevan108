import { useState } from "react";
import { API_URLS } from "../../utils/api";
import AddressAutocomplete from "../AddressAutocomplete";

type CreateStaffResponse = {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
};

export default function CreateStaffForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert file to base64
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      // Process profile picture
      let profilePictureBase64: string | undefined;
      if (profilePicture) {
        profilePictureBase64 = await fileToBase64(profilePicture);
      }

      const token = localStorage.getItem("token") || "";
      const res = await fetch(API_URLS.staff.create(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          phone,
          address,
          profilePicture: profilePictureBase64,
        }),
      });
      const data = (await res.json()) as Partial<CreateStaffResponse> & { message?: string };
      if (!res.ok) {
        setError(data?.message || "Failed to create staff");
        return;
      }
      setMessage(`Created staff: ${data.username}`);
      setUsername("");
      setEmail("");
      setPassword("");
      setPhone("");
      setAddress("");
      setProfilePicture(null);
      setProfilePicturePreview("");
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Create Staff</h3>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Full name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Strong password"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Address"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
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
                    setError("File size must be less than 5MB");
                    return;
                  }
                  setProfilePicture(file);
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setProfilePicturePreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          {profilePicturePreview && profilePicture && (
            <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-teal-900">Selected: {profilePicture.name}</p>
                <button
                  type="button"
                  onClick={() => {
                    setProfilePicture(null);
                    setProfilePicturePreview("");
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
              <img
                src={profilePicturePreview}
                alt="Profile picture preview"
                className="max-w-xs max-h-48 rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium px-5 py-2.5"
          >
            {submitting ? "Creating..." : "Create Staff"}
          </button>
          {message && <span className="text-teal-700 font-medium">{message}</span>}
          {error && <span className="text-red-600 font-medium">{error}</span>}
        </div>
      </form>
    </div>
  );
}


