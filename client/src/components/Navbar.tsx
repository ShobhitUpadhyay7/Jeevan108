import type { HTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";

type NavbarProps = HTMLAttributes<HTMLDivElement>;

export default function Navbar({ className, ...rest }: NavbarProps) {
  const navigate = useNavigate();

  return (
    <div className={["w-full flex justify-center pt-4", className].filter(Boolean).join(" ")} {...rest}>
      <div className="w-[94%] max-w-[1100px] bg-rose-50 rounded-full p-3 flex items-center gap-6 shadow-lg">
        <div className="mx-4 text-[28px] font-extrabold select-none">
          <span>jeevan</span>
          <span className="text-teal-400">108</span>
        </div>

        <div className="ml-auto flex items-center gap-9">
          <span className="bg-teal-400 text-white rounded-full px-6 py-2 font-extrabold">Home</span>
          <span className="font-extrabold text-[20px] cursor-pointer">Browse Providers</span>
          <span className="font-extrabold text-[20px] cursor-pointer">Apply</span>
          <span className="font-extrabold text-[20px] cursor-pointer">Check Status</span>
          <button
            onClick={() => navigate("/admin/login")}
            className="bg-teal-400 text-white rounded-full px-6 py-2 font-extrabold cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}


