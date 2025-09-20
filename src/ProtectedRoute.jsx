import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./utils/api";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await api.get("core/me/");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuthentication();
    // Add location.pathname to dependencies to re-check on navigation
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
