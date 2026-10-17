/** Decode role claim from JWT access token (no signature verify — client hint only). */
export function roleFromAccessToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return json.role ?? json.userRole ?? null;
  } catch {
    return null;
  }
}

export function getRoleFlags(roleRaw) {
  const userRole = String(roleRaw || "").toLowerCase();
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
  return { userRole, isSuperAdmin, isAdmin, isCoordinator, isMentor, isStudent };
}

/** Dashboard path after login — keep in sync with ProtectedRoute role checks. */
export function dashboardPathForRole(roleRaw) {
  const { isSuperAdmin, isAdmin, isCoordinator, isMentor } = getRoleFlags(roleRaw);
  if (isSuperAdmin) return "/super-admin";
  if (isCoordinator) return "/coordinator";
  if (isAdmin) return "/admin";
  if (isMentor) return "/mentor";
  return "/student";
}
