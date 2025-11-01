import type { HTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { API_URLS } from "../utils/api";

type NavbarProps = HTMLAttributes<HTMLDivElement>;

type UserInfo = {
  username?: string;
  role?: string;
  email?: string;
};

export default function Navbar({ className, ...rest }: NavbarProps) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    // Check auth status when storage changes (e.g., after login/logout in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  async function checkAuthStatus() {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setUserInfo(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URLS.auth.me(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setIsLoggedIn(true);
        setUserInfo(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    } catch (err) {
      console.error("Error checking auth status:", err);
      setIsLoggedIn(false);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUserInfo(null);
    navigate("/");
    window.location.reload(); // Refresh to update UI
  }

  return (
    <div className={["w-full flex justify-center pt-4", className].filter(Boolean).join(" ")} {...rest}>
      <div className="w-[94%] max-w-[1100px] bg-rose-50 rounded-full p-3 flex items-center gap-6 shadow-lg">
        <div className="mx-4 text-[28px] font-extrabold select-none">
          <span>jeevan</span>
          <span className="text-teal-400">108</span>
        </div>

        <div className="ml-auto flex items-center gap-9">
          <span 
            onClick={() => navigate("/")}
            className="bg-teal-400 text-white rounded-full px-6 py-2 font-extrabold cursor-pointer"
          >
            Home
          </span>
          <span 
            onClick={() => navigate("/browse")}
            className="font-extrabold text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
          >
            Browse Providers
          </span>
          <span 
            onClick={() => navigate("/apply")}
            className="font-extrabold text-[20px] cursor-pointer"
          >
            Apply
          </span>
          <span 
            onClick={() => navigate("/bookings")}
            className="font-extrabold text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
          >
            Check Status
          </span>
          {!isLoggedIn && (
            <span 
              onClick={() => navigate("/signup")}
              className="font-extrabold text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
            >
              Sign Up
            </span>
          )}
          
          {loading ? (
            <div className="w-20 h-8 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isLoggedIn && userInfo ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-700">
                  {userInfo.username || "User"}
                </span>
                <span className="text-xs text-gray-500">
                  {userInfo.role || "Logged in"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2 font-extrabold cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/admin/login")}
              className="bg-teal-400 text-white rounded-full px-6 py-2 font-extrabold cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


