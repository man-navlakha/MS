// File: src/components/LeftPanel.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from 'lucide-react';


export default function LeftPanel({ activeJob }) {
  const navigate = useNavigate();

  const handleGoToActiveJob = () => {
    if (activeJob && activeJob.request_id) {
      navigate(`/mechanic-found/${activeJob.request_id}`);
    }
  };


  return (
    <aside className="
      w-full bg-gray-200 rounded-3xl border-t-2 -mb-2 border-gray-900/30 shadow-md p-4 flex flex-col items-center justify-start space-y-3
      md:static md:h-auto md:w-72
      fixed pb-8  bottom-0 left-1/2 -translate-x-1/2 z-50
      md:translate-x-0 md:bottom-auto">
      {/* Search + Avatar */}
      <div className="flex items-center w-full gap-2">
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 px-3 py-2 rounded-lg bg-white text-sm text-gray-800 shadow-sm outline-none placeholder-gray-400"
        />
        <div onClick={() => navigate("/profile")} className="w-7 h-7 flex items-center justify-center rounded-full bg-red-800 text-white text-xs font-semibold cursor-pointer">
          M
        </div>
      </div>

      {/* Conditional Button: Active Job or Request Now */}
      {activeJob ? (
        <button
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-between"
          onClick={handleGoToActiveJob}
        >
          <span>Job in Progress</span>
          <ArrowRight size={20} />
        </button>
      ) : (
        <button
          className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition"
          onClick={() => navigate("/request")}
        >
          Request Now
        </button>
      )}

      {/* Past Order Card (Hidden on small screens) */}
      <div className="hidden md:flex w-full h-[360px] bg-white border border-gray-300 rounded-lg items-center justify-center text-gray-600 text-sm">
        Past order
      </div>
    </aside>
  );
}