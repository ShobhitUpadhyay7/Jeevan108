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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    // Check auth status when storage changes (e.g., after login/logout in another tab)
    const handleStorageChange = () => {
      checkAuthStatus();
    };
    window.addEventListener("storage", handleStorageChange);
    
    // Close mobile menu when window is resized to desktop size
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("resize", handleResize);
    };
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
    <div className={["w-full flex justify-center pt-2 sm:pt-4", className].filter(Boolean).join(" ")} {...rest}>
      <div className="w-[96%] sm:w-[94%] max-w-[1100px] bg-rose-50 rounded-full sm:rounded-full p-2 sm:p-3 flex items-center gap-2 sm:gap-4 md:gap-6 shadow-lg">
        {/* Logo */}
        <div 
          onClick={() => navigate("/")}
          className="text-xl sm:text-2xl md:text-[28px] font-extrabold select-none cursor-pointer flex-shrink-0 ml-2 sm:ml-4"
        >
          <span>jeevan</span>
          <span className="text-teal-400">108</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex ml-auto items-center gap-6 xl:gap-9">
          <span 
            onClick={() => navigate("/")}
            className="bg-teal-400 text-white rounded-full px-4 xl:px-6 py-1.5 xl:py-2 font-extrabold cursor-pointer text-sm xl:text-base"
          >
            Home
          </span>
          <span 
            onClick={() => navigate("/browse")}
            className="font-extrabold text-base xl:text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
          >
            Browse Providers
          </span>
          <span 
            onClick={() => navigate("/apply")}
            className="font-extrabold text-base xl:text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
          >
            Apply
          </span>
          <span 
            onClick={() => navigate("/bookings")}
            className="font-extrabold text-base xl:text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
          >
            Check Status
          </span>
          {!isLoggedIn && (
            <span 
              onClick={() => navigate("/signup")}
              className="font-extrabold text-base xl:text-[20px] cursor-pointer hover:text-teal-400 transition-colors"
            >
              Sign Up
            </span>
          )}
          
          {loading ? (
            <div className="w-16 xl:w-20 h-6 xl:h-8 flex items-center justify-center">
              <div className="w-3 xl:w-4 h-3 xl:h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isLoggedIn && userInfo ? (
            <div className="flex items-center gap-2 xl:gap-3">
              <div className="flex flex-col items-end">
                <span className="text-xs xl:text-sm font-semibold text-gray-700">
                  {userInfo.username || "User"}
                </span>
                <span className="text-[10px] xl:text-xs text-gray-500">
                  {userInfo.role || "Logged in"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-4 xl:px-6 py-1.5 xl:py-2 font-extrabold cursor-pointer transition-colors text-xs xl:text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/admin/login")}
              className="bg-teal-400 text-white rounded-full px-4 xl:px-6 py-1.5 xl:py-2 font-extrabold cursor-pointer text-sm xl:text-base"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile/Tablet Menu - Right side auth section */}
        <div className="ml-auto lg:hidden flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isLoggedIn && userInfo ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-gray-700 truncate max-w-[80px]">
                  {userInfo.username || "User"}
                </span>
                <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                  {userInfo.role || "User"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-3 sm:px-4 py-1 sm:py-1.5 font-extrabold cursor-pointer transition-colors text-xs sm:text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/admin/login")}
              className="bg-teal-400 text-white rounded-full px-3 sm:px-4 py-1 sm:py-1.5 font-extrabold cursor-pointer text-xs sm:text-sm"
            >
              Login
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-700 hover:text-teal-400 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-[96%] sm:w-[94%] max-w-[1100px] mt-2 bg-rose-50 rounded-2xl p-4 shadow-lg">
          <div className="flex flex-col gap-3">
            <span 
              onClick={() => {
                navigate("/");
                setIsMobileMenuOpen(false);
              }}
              className="bg-teal-400 text-white rounded-full px-4 py-2 font-extrabold cursor-pointer text-center text-sm sm:text-base"
            >
              Home
            </span>
            <span 
              onClick={() => {
                navigate("/browse");
                setIsMobileMenuOpen(false);
              }}
              className="font-extrabold text-base sm:text-lg cursor-pointer hover:text-teal-400 transition-colors text-center py-2"
            >
              Browse Providers
            </span>
            <span 
              onClick={() => {
                navigate("/apply");
                setIsMobileMenuOpen(false);
              }}
              className="font-extrabold text-base sm:text-lg cursor-pointer hover:text-teal-400 transition-colors text-center py-2"
            >
              Apply
            </span>
            <span 
              onClick={() => {
                navigate("/bookings");
                setIsMobileMenuOpen(false);
              }}
              className="font-extrabold text-base sm:text-lg cursor-pointer hover:text-teal-400 transition-colors text-center py-2"
            >
              Check Status
            </span>
            {!isLoggedIn && (
              <span 
                onClick={() => {
                  navigate("/signup");
                  setIsMobileMenuOpen(false);
                }}
                className="font-extrabold text-base sm:text-lg cursor-pointer hover:text-teal-400 transition-colors text-center py-2"
              >
                Sign Up
              </span>
            )}
            {isLoggedIn && userInfo && (
              <div className="border-t border-gray-300 pt-3 mt-2">
                <div className="text-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {userInfo.username || "User"}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    {userInfo.role || "Logged in"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


