import StarRating from "./StarRating";

type Worker = {
  _id: string;
  username: string;
  phone: string;
  address?: string;
  profilePicture?: string;
  role: string;
  createdAt?: string;
  hourlyRate?: number;
  dailyRate?: number;
  weeklyRate?: number;
  isAvailable?: boolean;
  averageRating?: number;
  reviewCount?: number;
};

type WorkerCardProps = {
  worker: Worker;
  onClick?: () => void;
  onBookNow?: () => void;
};

export default function WorkerCard({ worker, onClick, onBookNow }: WorkerCardProps) {
  function getRoleDisplayName(role: string): string {
    switch (role) {
      case "Nurse":
        return "Registered Nurse";
      case "Caretaker":
        return "Caretaker";
      case "Compounder":
        return "Compounder";
      default:
        return role;
    }
  }

  function getRoleBadgeColor(role: string): string {
    switch (role) {
      case "Nurse":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Caretaker":
        return "bg-green-100 text-green-700 border-green-200";
      case "Compounder":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        onClick ? "cursor-pointer hover:border-teal-400" : ""
      }`}
    >
      {/* Profile Picture Section */}
      <div className="relative h-48 bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
        {worker.profilePicture ? (
          <img
            src={worker.profilePicture}
            alt={worker.username}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-teal-500 flex items-center justify-center border-4 border-white shadow-lg">
            <span className="text-white text-4xl font-bold">
              {worker.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Role Badge */}
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
              worker.role
            )}`}
          >
            {getRoleDisplayName(worker.role)}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{worker.username}</h3>
          {(worker.averageRating || 0) > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={worker.averageRating || 0} size="sm" showNumber />
              <span className="text-xs text-gray-500">
                ({worker.reviewCount || 0})
              </span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-5 h-5 mr-2 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>{worker.phone}</span>
          </div>

          {worker.address && (
            <div className="flex items-start text-sm text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-teal-600 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-2">{worker.address}</span>
            </div>
          )}

          {worker.createdAt && (
            <div className="flex items-center text-xs text-gray-500 mt-3">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Member since {new Date(worker.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Pricing Info */}
        {worker.hourlyRate && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Starting from</div>
            <div className="text-lg font-bold text-teal-600">₹{worker.hourlyRate}/hour</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              View Details
            </button>
          )}
          {onBookNow && worker.isAvailable !== false && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookNow();
              }}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors"
            >
              Book Now
            </button>
          )}
          {worker.isAvailable === false && (
            <button
              disabled
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed"
            >
              Not Available
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

