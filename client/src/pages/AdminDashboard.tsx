import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URLS } from "../utils/api";
import CreateStaffForm from "../components/admin/CreateStaffForm";
import AdminSidebar from "../components/admin/AdminSidebar";
import ApplicationList from "../components/admin/ApplicationList";
import UserList from "../components/admin/UserList.tsx";
import StaffList from "../components/admin/StaffList";

export default function AdminDashboard() {
  const [name, setName] = useState<string>("");
  const location = useLocation();

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

  const renderContent = () => {
    if (location.pathname === "/admin/staff/create" || location.pathname === "/admin") {
      return <CreateStaffForm />;
    }
    if (location.pathname === "/admin/dashboard") {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Overview</h2>
          <p className="text-gray-600">Welcome to the admin dashboard. Select an option from the sidebar to get started.</p>
        </div>
      );
    }
    if (location.pathname === "/admin/applications") {
      return <ApplicationList />;
    }
    if (location.pathname === "/admin/users") {
      return <UserList />;
    }
    if (location.pathname === "/admin/staff") {
      return <StaffList />;
    }
    // Placeholder for other routes
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600">This section is under development.</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 ml-64">
        <section className="w-full min-h-screen py-8">
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
              {renderContent()}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


