// File: src/components/Navbar.jsx
import React, { useState } from "react";
import { Menu, X, User, LogIn, UserPlus, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/Login");
  };

  return (
    <nav className="w-full fixed top-0 left-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src="/ms.png" alt="Mechanic Set Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">
            Mechanic Set
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                onClick={() => navigate("/Login")}
              >
                <LogIn size={18} />
                Login
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                onClick={() => navigate("/verify")}
              >
                <UserPlus size={18} />
                Signup
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
                onClick={() => navigate("/profile")}
              >
                <User size={18} />
                Profile
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg hover:bg-gray-100 transition"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-800 rounded-lg hover:bg-gray-200 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg transition-all duration-300">
          <div className="flex flex-col gap-1 p-4">
           
              <>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                  onClick={() => navigate("/profile")}
                >
                  <User size={18} /> Profile
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                  onClick={handleLogout}
                >
                  <LogOut size={18} /> Logout
                </button>
              </>
          </div>
        </div>
      )}
    </nav>
  );
}
