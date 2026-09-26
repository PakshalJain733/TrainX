import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();

  // 1. Retrieve auth token
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("auth_token");

  // 2. Retrieve user object
  let user = null;
  try {
    const rawUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (rawUser) user = JSON.parse(rawUser);
  } catch (e) {
    user = null;
  }

  // If unauthenticated, redirect to login page
  if (!token || !user || !user.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = String(user.role).toLowerCase();

  // Determine user role flags
  const isSuperAdmin = userRole.includes("superadmin") || userRole.includes("super admin") || userRole.includes("super_admin") || userRole.includes("super");
  const isAdmin = (userRole.includes("admin") || userRole.includes("college_admin") || userRole.includes("hod")) && !isSuperAdmin;
  const isCoordinator = userRole.includes("coordinator");
  const isMentor = userRole.includes("mentor") || userRole.includes("faculty");
  const isStudent = userRole.includes("student") || userRole === "user";

  // Check if role is authorized
  let isAllowed = false;
  if (!allowedRoles || allowedRoles.length === 0) {
    isAllowed = true;
  } else {
    for (const reqRole of allowedRoles) {
      const canonical = String(reqRole).toLowerCase();
      if ((canonical === "superadmin" || canonical === "super_admin") && isSuperAdmin) isAllowed = true;
      if ((canonical === "admin" || canonical === "college_admin" || canonical === "hod") && (isAdmin || isSuperAdmin)) isAllowed = true;
      if (canonical === "coordinator" && (isCoordinator || isSuperAdmin)) isAllowed = true;
      if ((canonical === "mentor" || canonical === "faculty") && (isMentor || isSuperAdmin)) isAllowed = true;
      if (canonical === "student" && (isStudent || isSuperAdmin)) isAllowed = true;
      if (userRole === canonical) isAllowed = true;
    }
  }

  if (!isAllowed) {
    // If unauthorized for requested route, redirect to user's assigned dashboard
    if (isSuperAdmin) return <Navigate to="/super-admin" replace />;
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isCoordinator) return <Navigate to="/coordinator" replace />;
    if (isMentor) return <Navigate to="/mentor" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
}
