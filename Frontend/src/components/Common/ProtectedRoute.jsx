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

  const role = String(user.role).toLowerCase();

  // Determine user role flags
  const isSuperAdmin = role.includes("superadmin") || role.includes("super admin") || role.includes("super_admin");
  const isAdmin = role.includes("admin") && !isSuperAdmin;
  const isCoordinator = role.includes("coordinator");
  const isMentor = role.includes("mentor") || role.includes("faculty");
  const isStudent = role.includes("student") || role === "user";

  // Check if role is authorized
  let isAllowed = false;
  if (allowedRoles.length === 0) {
    isAllowed = true;
  } else {
    for (const reqRole of allowedRoles) {
      const lowerReq = reqRole.toLowerCase();
      if (lowerReq === "superadmin" && isSuperAdmin) isAllowed = true;
      if (lowerReq === "admin" && (isAdmin || isSuperAdmin)) isAllowed = true;
      if (lowerReq === "coordinator" && (isCoordinator || isSuperAdmin)) isAllowed = true;
      if (lowerReq === "mentor" && (isMentor || isSuperAdmin)) isAllowed = true;
      if (lowerReq === "student" && (isStudent || isSuperAdmin)) isAllowed = true;
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
