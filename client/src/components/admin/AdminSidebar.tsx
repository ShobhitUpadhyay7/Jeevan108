import { Link, useLocation } from "react-router-dom";

type NavItem = {
  label: string;
  path: string;
  icon?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Create Staff", path: "/admin/staff/create" },
  { label: "Manage Staff", path: "/admin/staff" },
  { label: "Application List", path: "/admin/applications" },
  { label: "Users", path: "/admin/users" },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm fixed left-0 top-0 pt-16">
      <div className="p-4">
        <div className="mb-8 px-3">
          <h2 className="text-xl font-extrabold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Jeevan 108</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-teal-50 text-teal-700 font-semibold border-l-4 border-teal-500"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
