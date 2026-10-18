import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken } from "../../utils/api";
import { roleFromAccessToken, getRoleFlags } from "../../utils/authRole";

/**
 * Enterprise Production-Ready Protected Route Guard.
 * Enforces authenticated tokens and validates role-based access control (RBAC).
 * Unauthenticated requests are redirected to login with return path preserved.
 * Unauthorized requests are redirected to the user's primary assigned dashboard.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();

  const token = getAuthToken();

  // Retrieve authenticated user object
  let user = null;
  try {
    const rawUser = sessionStorage.getItem("user") || localStorage.getItem("user");
    if (rawUser) user = JSON.parse(rawUser);
  } catch (_e) {
    user = null;
  }

  // Populate role from access token if user object is partially incomplete
  if (token && (!user || !user.role)) {
    const jwtRole = roleFromAccessToken(token);
    if (jwtRole) {
      user = { ...(user || {}), role: jwtRole };
      try {
        sessionStorage.setItem("user", JSON.stringify(user));
      } catch (_e) {
        // Storage access handled gracefully
      }
    }
  }

  // If unauthenticated or token is missing, redirect to login
  if (!token || !user || !user.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const { userRole, isSuperAdmin, isAdmin, isCoordinator, isMentor, isStudent } = getRoleFlags(user.role);

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
    // If unauthorized, redirect to user's assigned dashboard
    if (isSuperAdmin) return <Navigate to="/super-admin" replace />;
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isCoordinator) return <Navigate to="/coordinator" replace />;
    if (isMentor) return <Navigate to="/mentor" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
}
