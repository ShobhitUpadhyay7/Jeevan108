import { useEffect, useState } from "react";
import { API_URLS } from "../utils/api";
import CreateStaffForm from "../components/admin/CreateStaffForm";

export default function AdminDashboard() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(API_URLS.auth.me(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json().then((j) => ({ ok: r.ok, body: j })))
      .then(({ ok, body }) => {
        if (ok && body?.username) setName(body.username as string);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="w-full min-h-[80vh] bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome{ name ? `, ${name}` : "" }. Manage your platform here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <CreateStaffForm />
        </div>
      </div>
    </section>
  );
}


