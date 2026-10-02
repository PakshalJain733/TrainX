import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();

  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

  // 1. Retrieve auth token
  let token =
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("auth_token");

  // 2. Retrieve user object
  let user = null;
  try {
    const rawUser = sessionStorage.getItem("user") || sessionStorage.getItem("user");
    if (rawUser) user = JSON.parse(rawUser);
  } catch (e) {
    user = null;
  }

  // Localhost Developer Mode: Allow direct URL navigation (e.g. localhost:5173/admin, /coordinator, /mentor)
  if (isLocalhost) {
    const currentPath = location.pathname.toLowerCase();
    let targetRole = null;
    let devName = null;

    if (currentPath.includes("/super-admin") || currentPath.includes("/superadmin")) {
      targetRole = "superadmin";
      devName = "Local Super Admin";
    } else if (currentPath.includes("/coordinator")) {
      targetRole = "coordinator";
      devName = "Local Coordinator";
    } else if (currentPath.includes("/admin")) {
      targetRole = "college_admin";
      devName = "Local Admin";
    } else if (currentPath.includes("/mentor")) {
      targetRole = "mentor";
      devName = "Local Mentor";
    } else if (currentPath.includes("/student")) {
      targetRole = "student";
      devName = "Local Student";
    }

    const userRoleStr = user?.role ? String(user.role).toLowerCase() : "";
    const isMatchingRole =
      !targetRole ||
      userRoleStr.includes("super") ||
      (targetRole === "college_admin" && (userRoleStr.includes("admin") || userRoleStr.includes("college_admin") || userRoleStr.includes("hod"))) ||
      (targetRole === "coordinator" && userRoleStr.includes("coordinator")) ||
      (targetRole === "mentor" && (userRoleStr.includes("mentor") || userRoleStr.includes("faculty"))) ||
      (targetRole === "student" && (userRoleStr.includes("student") || userRoleStr === "user"));

    if (targetRole && (!isMatchingRole || !token || !user || !user.role)) {
      const mockDevUser = {
        id: 99999,
        name: devName || "Local User",
        email: `${targetRole}@localhost.dev`,
        role: targetRole,
        college_id: 1,
        is_profile_updated: true,
        profileCompleted: true,
      };

      token = "mock_localhost_dev_token";
      user = mockDevUser;

      try {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("authToken", token);
        sessionStorage.setItem("role", targetRole);
        sessionStorage.setItem("user", JSON.stringify(mockDevUser));
      } catch (_) {}
    }
  }

  // In Deployed / Production environment: if unauthenticated, redirect to login page
  if (!token || !user || !user.role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = String(user.role).toLowerCase();

  // Determine user role flags
  const isSuperAdmin =
    userRole.includes("superadmin") ||
    userRole.includes("super admin") ||
    userRole.includes("super_admin") ||
    userRole.includes("super");
  const isAdmin =
    (userRole.includes("admin") || userRole.includes("college_admin") || userRole.includes("hod")) &&
    !isSuperAdmin;
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
    if (isLocalhost) {
      return children;
    }
    // If unauthorized on production, redirect to user's assigned dashboard
    if (isSuperAdmin) return <Navigate to="/super-admin" replace />;
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isCoordinator) return <Navigate to="/coordinator" replace />;
    if (isMentor) return <Navigate to="/mentor" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
}
