import { useState } from "react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import { API_URLS } from "../utils/api";

type Role = "Nurse" | "Caretaker" | "Compounder";

type ApplicationResponse = {
  applicationId: string;
  status: string;
};

export default function Application() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [role, setRole] = useState<Role | "">("");
  const [governmentId, setGovernmentId] = useState<File | null>(null);
  const [governmentIdPreview, setGovernmentIdPreview] = useState<string>("");
  const [nursingRegistrationCertificate, setNursingRegistrationCertificate] = useState<File | null>(null);
  const [nursingRegistrationCertificatePreview, setNursingRegistrationCertificatePreview] = useState<string>("");
  const [trainingCertificate, setTrainingCertificate] = useState<File | null>(null);
  const [trainingCertificatePreview, setTrainingCertificatePreview] = useState<string>("");
  const [policeVerificationCertificate, setPoliceVerificationCertificate] = useState<File | null>(null);
  const [policeVerificationCertificatePreview, setPoliceVerificationCertificatePreview] = useState<string>("");
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

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

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    if (!role) {
      setError("Please select a role");
      setSubmitting(false);
      return;
    }

    try {
      const documents: Record<string, string> = {};
      
      // Convert files to base64
      if (governmentId) {
        documents.governmentId = await fileToBase64(governmentId);
      }
      if (nursingRegistrationCertificate) {
        documents.nursingRegistrationCertificate = await fileToBase64(nursingRegistrationCertificate);
      }
      if (trainingCertificate) {
        documents.trainingCertificate = await fileToBase64(trainingCertificate);
      }
      if (policeVerificationCertificate) {
        documents.policeVerificationCertificate = await fileToBase64(policeVerificationCertificate);
      }

      // Process profile picture
      let profilePictureBase64: string | undefined;
      if (profilePicture) {
        profilePictureBase64 = await fileToBase64(profilePicture);
      }

      const res = await fetch(API_URLS.applications.submit(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          phone,
          address: address || undefined,
          profilePicture: profilePictureBase64 || undefined,
          role,
          documents: Object.keys(documents).length > 0 ? documents : undefined,
        }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        if (res.status === 413) {
          setError("File size too large. Please ensure each file is less than 5MB.");
        } else {
          setError(`Server returned an error. Check if the endpoint exists. Status: ${res.status}`);
        }
        console.error("Non-JSON response:", text.substring(0, 200));
        return;
      }

      const data = (await res.json()) as Partial<ApplicationResponse> & { message?: string };
      
      if (!res.ok) {
        if (res.status === 413) {
          setError("File size too large. Please ensure each file is less than 5MB.");
        } else {
          setError(data?.message || `Failed to submit application (Status: ${res.status})`);
        }
        return;
      }

      setMessage("Application submitted successfully! Your application is under review.");
      setApplicationId(data.applicationId || null);
      
      // Reset form
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setAddress("");
      setProfilePicture(null);
      setProfilePicturePreview("");
      setRole("");
      setGovernmentId(null);
      setGovernmentIdPreview("");
      setNursingRegistrationCertificate(null);
      setNursingRegistrationCertificatePreview("");
      setTrainingCertificate(null);
      setTrainingCertificatePreview("");
      setPoliceVerificationCertificate(null);
      setPoliceVerificationCertificatePreview("");
    } catch (err) {
      console.error("Application submission error:", err);
      const errorMessage = err instanceof Error ? err.message : "Network error. Please check if the server is running.";
      setError(`Error: ${errorMessage}. Make sure the backend server is running on http://localhost:7001`);
    } finally {
      setSubmitting(false);
    }
  }

  const isNurse = role === "Nurse";
  const isCompounder = role === "Compounder";

  return (
    <section className="w-full min-h-screen bg-gray-50 py-12 px-4 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            Join <span className="text-teal-600">Jeevan 108</span>
          </h1>
          <p className="text-gray-600">
            Apply to become a healthcare professional on our platform
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Application Form</h2>
            <p className="text-sm text-gray-500 mt-1">
              Please fill in all required fields to submit your application
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(["Nurse", "Caretaker", "Compounder"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      role === r
                        ? "border-teal-500 bg-teal-50 text-teal-700 font-semibold"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="Your complete address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Documents Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload your documents (PDF, JPG, or PNG format, max 5MB each)
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Government ID
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    (Aadhar Card / PAN Card)
                  </p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold text-teal-600 hover:text-teal-700">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError("File size must be less than 5MB");
                            return;
                          }
                          setGovernmentId(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setGovernmentIdPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {governmentIdPreview && governmentId && (
                    <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-teal-900">Selected: {governmentId.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setGovernmentId(null);
                            setGovernmentIdPreview("");
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <img 
                        src={governmentIdPreview} 
                        alt="Government ID preview" 
                        className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                        onError={(e) => {
                          // If it's a PDF, show a placeholder
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {isNurse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nursing Registration Certificate
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold text-teal-600 hover:text-teal-700">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              setError("File size must be less than 5MB");
                              return;
                            }
                            setNursingRegistrationCertificate(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNursingRegistrationCertificatePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {nursingRegistrationCertificatePreview && nursingRegistrationCertificate && (
                      <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-teal-900">Selected: {nursingRegistrationCertificate.name}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setNursingRegistrationCertificate(null);
                              setNursingRegistrationCertificatePreview("");
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <img 
                          src={nursingRegistrationCertificatePreview} 
                          alt="Nursing Registration Certificate preview" 
                          className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isCompounder && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Training Certificate
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold text-teal-600 hover:text-teal-700">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              setError("File size must be less than 5MB");
                              return;
                            }
                            setTrainingCertificate(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTrainingCertificatePreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {trainingCertificatePreview && trainingCertificate && (
                      <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-teal-900">Selected: {trainingCertificate.name}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTrainingCertificate(null);
                              setTrainingCertificatePreview("");
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <img 
                          src={trainingCertificatePreview} 
                          alt="Training Certificate preview" 
                          className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Police Verification Certificate
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold text-teal-600 hover:text-teal-700">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError("File size must be less than 5MB");
                            return;
                          }
                          setPoliceVerificationCertificate(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPoliceVerificationCertificatePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {policeVerificationCertificatePreview && policeVerificationCertificate && (
                    <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-teal-900">Selected: {policeVerificationCertificate.name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPoliceVerificationCertificate(null);
                            setPoliceVerificationCertificatePreview("");
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <img 
                        src={policeVerificationCertificatePreview} 
                        alt="Police Verification Certificate preview" 
                        className="max-w-xs max-h-48 rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium px-6 py-3"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
              
              {message && (
                <div className="flex-1">
                  <p className="text-teal-700 font-medium">{message}</p>
                  {applicationId && (
                    <p className="text-sm text-gray-600 mt-1">
                      Application ID: <span className="font-mono">{applicationId}</span>
                    </p>
                  )}
                </div>
              )}
              
              {error && (
                <p className="text-red-600 font-medium flex-1">{error}</p>
              )}
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="font-semibold text-teal-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
            <li>Your application will be reviewed by our admin team</li>
            <li>You'll receive an email notification once your application is processed</li>
            <li>If approved, you'll be able to log in and start providing services</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
