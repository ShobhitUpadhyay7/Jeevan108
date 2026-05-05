import { Link } from "react-router-dom";

export default function BackToHomeButton() {
  return (
    <Link
      to="/"
      className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm transition-colors hover:bg-teal-50"
    >
      <span aria-hidden="true">←</span>
      <span>Back to Home</span>
    </Link>
  );
}
