import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URLS } from "../utils/api";

type LoginResponse = {
  token?: string;
  message?: string;
};

// /api/auth/me does not include role; we'll verify admin by hitting an admin-only route

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(API_URLS.auth.login(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: LoginResponse = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Login failed");
      }
      if (!data.token) {
        throw new Error("Missing token in response");
      }

      // Store token and verify admin via admin-protected endpoint
      localStorage.setItem("token", data.token);
      const adminProbe = await fetch(API_URLS.staff.list(), {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (!adminProbe.ok) {
        localStorage.removeItem("token");
        throw new Error("Only Admin users can sign in here");
      }
      setSuccess("Logged in as Admin.");
      navigate("/admin", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-slate-200 rounded-xl p-6 shadow-xl">
        <div className="mb-4">
          <h1 className="text-2xl font-bold leading-none">Admin Login</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in with your admin account</p>
        </div>

        <label className="block text-xs font-medium text-slate-600 mt-4 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="admin@example.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
        />

        <label className="block text-xs font-medium text-slate-600 mt-4 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
        />

        {error && (
          <div className="mt-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 text-sm text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-2">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg border border-teal-600 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold px-3 py-2 transition-colors"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}


