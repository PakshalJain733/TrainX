/**
 * Utility to extract clean department short code
 */
export function getShortDept(dept) {
  if (!dept) return "";
  const d = String(dept).toLowerCase().trim();
  if (d.includes("electronics") || d.includes("ecs") || d.includes("extc")) return "ECS";
  if (d.includes("computer") || d.includes("comps") || d === "cs" || d === "ce") return "CS";
  if (d.includes("information") || d === "it") return "IT";
  if (d.includes("intelligence") || d.includes("data") || d.includes("aids") || d.includes("aiml")) return "AIDS";
  return String(dept).trim().toUpperCase();
}
