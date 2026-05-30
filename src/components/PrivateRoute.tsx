import { message } from "antd";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
  requiredPermission?: string;
  routeKey?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
  routeKey,
}) => {
  const token = localStorage.getItem("jwtToken");
  const persistRoot = localStorage.getItem("persist:root");
  const auth = persistRoot ? JSON.parse(persistRoot).auth : null;
  const user = auth ? JSON.parse(auth).user : null;
  const rolePermissions = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const userRole = user?.role || "";

  if (!token) {
    // If the token is not found, redirect to login
    return <Navigate to="/login" replace />;
  }

  // Allow ADMIN and SUPER_ADMIN to access everything
  if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to a safe route
    message.error("You do not have permission to access this feature.");
    return <Navigate to="/elections" replace />;
  }
  // If the token is found, render the requested page
  // Permission-based access control

  // if (requiredPermission && routeKey) {
  //   const userPermissions = rolePermissions[routeKey] || [];

  //     if (!userPermissions.includes(requiredPermission)) {
  //       return <Navigate to="/elections" replace />;
  //     }
  // }

  return <>{children}</>;
};

export default PrivateRoute;
