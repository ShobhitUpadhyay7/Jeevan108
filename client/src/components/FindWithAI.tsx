import { useState } from "react";
import { API_URLS } from "../utils/api";

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
};

type QuestionAnswer = {
  careType?: string;
  patientType?: string;
  duration?: string;
  budget?: string;
  specialRequirements?: string[];
};

type FindWithAIProps = {
  workers: Worker[];
  onRecommend: (recommendedWorkers: Worker[], reasoning: string) => void;
  onClose: () => void;
};

export default function FindWithAI({ workers, onRecommend, onClose }: FindWithAIProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer>({
    specialRequirements: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = [
    {
      id: "careType",
      question: "What type of care do you need?",
      options: [
        { value: "medical", label: "Medical Care (Injections, Monitoring)", icon: "💉" },
        { value: "daily", label: "Daily Assistance (Feeding, Bathing)", icon: "🤲" },
        { value: "medication", label: "Medication Management", icon: "💊" },
        { value: "general", label: "General Healthcare Support", icon: "🏥" },
      ],
    },
    {
      id: "patientType",
      question: "Who needs care?",
      options: [
        { value: "elderly", label: "Elderly Person", icon: "👴" },
        { value: "post-surgery", label: "Post-Surgery Patient", icon: "🏥" },
        { value: "chronic", label: "Chronic Illness Care", icon: "🩺" },
        { value: "general", label: "General Health Support", icon: "👤" },
      ],
    },
    {
      id: "duration",
      question: "How long do you need the service?",
      options: [
        { value: "few-hours", label: "Few Hours (2-4 hours)", icon: "⏰" },
        { value: "full-day", label: "Full Day (8-12 hours)", icon: "☀️" },
        { value: "multiple-days", label: "Multiple Days/Week", icon: "📅" },
        { value: "long-term", label: "Long-term (Weeks/Months)", icon: "🗓️" },
      ],
    },
    {
      id: "budget",
      question: "What's your budget preference?",
      options: [
        { value: "budget", label: "Budget-Friendly", icon: "💰" },
        { value: "moderate", label: "Moderate", icon: "💵" },
        { value: "premium", label: "Premium", icon: "💎" },
        { value: "any", label: "Any Price", icon: "💳" },
      ],
    },
    {
      id: "specialRequirements",
      question: "Any special requirements? (Select all that apply)",
      options: [
        { value: "night-shift", label: "Night Shifts", icon: "🌙" },
        { value: "24-7", label: "24/7 Care", icon: "⏱️" },
        { value: "experienced", label: "Highly Experienced", icon: "⭐" },
        { value: "nearby", label: "Nearby Location", icon: "📍" },
      ],
      multiple: true,
    },
  ];

  const handleAnswer = (questionId: string, value: string) => {
    if (questionId === "specialRequirements") {
      const currentReqs = answers.specialRequirements || [];
      const newReqs = currentReqs.includes(value)
        ? currentReqs.filter((req) => req !== value)
        : [...currentReqs, value];
      setAnswers({ ...answers, specialRequirements: newReqs });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
    setError(null);
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await generateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URLS.chatbot.recommendWorkers(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: answers,
          workers: workers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI recommendations");
      }

      onRecommend(data.workers || [], data.reasoning || "Recommended based on your preferences");
      onClose();
    } catch (err) {
      console.error("AI recommendation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed =
    currentQuestion.multiple ||
    (answers[currentQuestion.id as keyof QuestionAnswer] !== undefined &&
      answers[currentQuestion.id as keyof QuestionAnswer] !== "");

  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🤖</span> Find with AI
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="text-sm opacity-90">
          Step {currentStep + 1} of {questions.length}
        </div>
        <div className="mt-2 w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && isLastStep ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">AI is analyzing your preferences...</p>
            <p className="text-sm text-gray-500 mt-2">Finding the best healthcare providers for you</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected =
                  currentQuestion.multiple
                    ? answers.specialRequirements?.includes(option.value)
                    : answers[currentQuestion.id as keyof QuestionAnswer] === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(currentQuestion.id, option.value)}
                    disabled={loading}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? "border-teal-600 bg-teal-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-900">{option.label}</span>
                      {isSelected && (
                        <span className="ml-auto text-teal-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer with Navigation */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed || loading}
            className={`flex-1 px-4 py-3 font-semibold rounded-lg transition-colors ${
              canProceed && !loading
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : isLastStep ? (
              "Find Providers"
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
