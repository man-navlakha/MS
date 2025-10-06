// File: src/components/LeftPanel.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LeftPanel() {
  const navigate = useNavigate();

  return (
    <aside className="
      w-72 bg-gray-200 rounded-xl shadow-md p-4 flex flex-col items-center justify-start space-y-3
      md:static md:h-auto md:w-72
      fixed bottom-4 left-1/2 -translate-x-1/2 z-50
      md:translate-x-0 md:bottom-auto
    ">
      {/* Search + Avatar */}
      <div className="flex items-center w-full gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 px-3 py-2 rounded-lg bg-white text-sm text-gray-800 shadow-sm outline-none placeholder-gray-400"
        />
        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-red-800 text-white text-xs font-semibold cursor-pointer">
          M
        </div>
      </div>

      {/* Request Now Button */}
      <button
        className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition"
        onClick={() => navigate("/request")}
      >
        Request Now
      </button>

      {/* Past Order Card (Hidden on small screens) */}
      <div className="hidden md:flex w-full flex-1 bg-white border border-gray-300 rounded-lg items-center justify-center text-gray-600 text-sm">
        Past order
      </div>
    </aside>
  );
}
