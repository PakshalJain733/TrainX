/**
 * Utility to extract clean department short code
 */
export function getShortDept(dept) {
  if (!dept) return "";
  const d = String(dept).toLowerCase().trim();
  // 1. Telecom / EXTC
  if (d.includes("extc") || d.includes("telecom")) return "EXTC";
  // 2. Electronics / ECS (Must be checked BEFORE computer because of "Electronics & Computer Science"!)
  if (d.includes("electronics") || d.includes("electronic") || /\becs\b/.test(d) || d === "ecs") return "ECS";
  // 3. AI / Data Science / AIDS
  if (d.includes("intelligence") || d.includes("data") || d.includes("aids") || d.includes("aiml") || d.includes("ai&ds") || d.includes("ai-ds")) return "AIDS";
  // 4. IT / Information Technology
  if (d.includes("information") || d.includes("info tech") || /\bit\b/.test(d) || d === "it") return "IT";
  // 5. CS / CE / Computer Engineering / Computer Science
  if (d.includes("computer") || d.includes("comps") || d.includes("cse") || /\bcs\b/.test(d) || /\bce\b/.test(d) || d === "cs" || d === "ce") return "CS";
  // 6. Mechanical
  if (d.includes("mech")) return "MECH";
  // 7. Civil
  if (d.includes("civil")) return "CIVIL";
  // 8. Electrical
  if (d.includes("elect") || /\bee\b/.test(d) || d === "ee") return "EE";
  return String(dept).trim().toUpperCase();
}

/**
 * Check if two department strings represent the same academic branch
 */
export function isSameDepartment(deptA, deptB) {
  if (!deptA || !deptB) return false;
  const a = getShortDept(deptA);
  const b = getShortDept(deptB);
  if (!a || !b) return false;
  return a === b;
}
