// File: src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, UserPlus, LogOut } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication token in localStorage
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const activeLinkStyle = {
    color: '#3b82f6', // blue-600
    fontWeight: '600',
  };

  const navLinks = 
    <>
      <NavLink to="/profile" style={({ isActive }) => isActive ? activeLinkStyle : undefined} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition">
        <User size={18} />
        Profile
      </NavLink>
      <NavLink to="/logout"
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
        onClick={() => navigate("/logout")}
      >
        <LogOut size={18} />
        Logout
      </NavLink>
    </>

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src="/ms.png" alt="Mechanic Setu Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-gray-900 drop-shadow-sm">
            Mechanic Setu
          </h1>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-800 rounded-lg hover:bg-gray-200 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg absolute w-full left-0 top-full">
          <div className="flex flex-col gap-1 p-4" onClick={() => setMenuOpen(false)}>
            {navLinks}
          </div>
        </nav>
      )}
    </header>
  );
}