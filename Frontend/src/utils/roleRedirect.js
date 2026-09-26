export const getRoleLandingRoute = (role = "") => {
  const r = String(role || "").toLowerCase();
  if (r.includes("super")) return "/super-admin";
  if (r.includes("coordinator")) return "/coordinator";
  if (r.includes("mentor") || r.includes("faculty")) return "/mentor";
  if (r.includes("admin") || r.includes("hod")) return "/admin";
  return "/student";
};