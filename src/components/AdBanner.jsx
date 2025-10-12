import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function AdBanner() {
  return (
    <div className="w-full bg-white border border-gray-300 rounded-xl shadow-md p-4 flex flex-col sm:flex-row items-center justify-between gap-3 hover:shadow-lg transition">
      <div className="text-center sm:text-left">
        <h3 className="text-lg font-bold text-gray-800">📘 Pixel Class</h3>
        <p className="text-sm text-gray-600">Download high-quality & handwritten notes for free</p>
      </div>
      <a
        href="https://pixelclass.in"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 sm:mt-0 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
      >
        Explore Now <ArrowUpRight size={16} />
      </a>
    </div>
  );
}
