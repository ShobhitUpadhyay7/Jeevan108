import { useState, useRef, useEffect } from "react";
import { API_URLS } from "../utils/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your friendly medical assistant chatbot. Ask me anything about health and medicine - I can understand your questions in any format, even with typos! Just ask naturally and I'll do my best to help. Remember, I provide general information and am not a substitute for professional medical advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URLS.chatbot.chat(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      const errorMsg: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button - Left Side (hidden when fullscreen) */}
      {!isFullscreen && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-[60] bg-teal-500 hover:bg-teal-600 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-300 hover:scale-110 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-label="Open Medical Chatbot"
        >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 sm:h-6 sm:w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          )}
        </svg>
        </button>
      )}

      {/* Chat Window - Slides from Left */}
      {(isOpen || isFullscreen) && (
      <div
        className={`fixed z-[60] bg-white shadow-2xl border border-slate-200 transition-all duration-300 ease-in-out ${
          isFullscreen
            ? "inset-0 rounded-none opacity-100"
            : `left-2 right-2 sm:left-4 sm:right-auto sm:bottom-24 bottom-20 w-auto sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-3rem)] rounded-xl ${
                isOpen
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-[-120%] pointer-events-none"
              }`
        }`}
        style={isFullscreen ? { height: "100vh" } : { maxHeight: "calc(100vh - 120px)", height: "auto" }}
      >
        {/* Header */}
        <div className={`bg-teal-500 text-white p-3 sm:p-4 flex items-center justify-between ${isFullscreen ? "" : "rounded-t-xl"}`}>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold truncate">Medical Assistant</h3>
            <p className="text-xs text-teal-50 truncate">Ask medical questions</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Fullscreen Toggle Button */}
            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                if (!isOpen) setIsOpen(true);
              }}
              className="text-white hover:text-teal-200 transition-colors p-1"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
            {/* Close Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsFullscreen(false);
              }}
              className="text-white hover:text-teal-200 transition-colors p-1"
              aria-label="Close chat"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 bg-slate-50"
          style={isFullscreen ? { height: "calc(100vh - 160px)" } : { maxHeight: "300px", minHeight: "250px" }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm ${
                  msg.role === "user"
                    ? "bg-teal-500 text-white"
                    : "bg-white text-slate-800 border border-slate-200"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className={`p-2.5 sm:p-3 border-t border-slate-200 bg-white ${isFullscreen ? "" : "rounded-b-xl"}`}
        >
          {error && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 break-words">
              {error}
            </div>
          )}
          <div className="flex gap-1.5 sm:gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any medical question..."
              className="flex-1 text-xs sm:text-sm rounded-lg border border-slate-300 px-2 sm:px-3 py-1.5 sm:py-2 outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm whitespace-nowrap"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 hidden sm:block">
            Ask naturally - I understand any format, even with typos!
          </p>
        </form>
      </div>
      )}
    </>
  );
}