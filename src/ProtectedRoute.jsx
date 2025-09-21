import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./utils/api";
import './pp.css'

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
    return <div className="h-screen flex justify-center items-center">
<div className="main ">
  <div className="up">
    <div className="loaders">
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
    </div>
    <div className="loadersB">
      <div className="loaderA">
        <div className="ball0"></div>
      </div>
      <div className="loaderA">
        <div className="ball1"></div>
      </div>
      <div className="loaderA">
        <div className="ball2"></div>
      </div>
      <div className="loaderA">
        <div className="ball3"></div>
      </div>
      <div className="loaderA">
        <div className="ball4"></div>
      </div>
      <div className="loaderA">
        <div className="ball5"></div>
      </div>
      <div className="loaderA">
        <div className="ball6"></div>
      </div>
      <div className="loaderA">
        <div className="ball7"></div>
      </div>
      <div className="loaderA">
        <div className="ball8"></div>
      </div>
    </div>
  </div>
</div>
</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
