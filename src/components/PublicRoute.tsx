import React from "react";
import { Navigate } from "react-router-dom";

interface PublicRouteProps {
  children: JSX.Element;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const token = localStorage.getItem("jwtToken");
  const role = localStorage.getItem("role");

  const getPostLoginRoute = (userRole?: string | null) => {
    const normalizedRole = (userRole || role || "").toString().toUpperCase();
    return (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN") 
      ? "/static-dashboard" 
      : "/cadre-info";
  };

  if (token) {
    // If user is already logged in, redirect to dashboard
    return <Navigate to={getPostLoginRoute()} replace />;
  }

  return children;
};

export default PublicRoute;
