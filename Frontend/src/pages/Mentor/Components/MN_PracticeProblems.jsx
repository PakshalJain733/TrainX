import React from "react";
import AdminPracticeProblems from "../../Admin/Components/AD_PracticeProblems";
import "../Styles/MN_PracticeProblems.css";

/**
 * Mentor Practice Problems Manager
 * Uses the exact same rich, unified "Add Coding Problem" modal, test case builder,
 * AI problem generator, problem history, and submission code review as Admin,
 * connected directly to mentor-scoped API endpoints (/mentor/practice-problems).
 */
export default function MentorPracticeProblems() {
  return <AdminPracticeProblems role="mentor" />;
}
