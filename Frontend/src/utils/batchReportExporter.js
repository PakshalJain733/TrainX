import * as XLSX from "xlsx";
import { apiFetch } from "./api";

/**
 * Downloads and generates an Excel report of task submissions for a batch.
 * Format:
 *   - Column Headers: Name of each task (plus Roll No, Student Name, Email, Department, and Summary)
 *   - Rows: Student names and their task submission scores/statuses
 *   - Scope:
 *       - Admin/Trainer: All enrolled students in this batch
 *       - Mentor: Only assigned students of this mentor in this batch
 * 
 * @param {number|string} batchId - The batch ID
 * @param {string} [batchName] - Optional batch name for filename/sheet
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function downloadBatchTaskReport(batchId, batchName = "") {
  if (!batchId) {
    throw new Error("Batch ID is required");
  }

  const cleanBatchId = String(batchId).replace(/[^0-9]/g, "") || batchId;
  const res = await apiFetch(`/batches/${cleanBatchId}/task-report`);

  if (res?.error) {
    throw new Error(res.error || "Failed to fetch task report data");
  }

  const reportData = res?.data || res;
  const students = reportData?.students || [];
  const tasks = reportData?.tasks || [];
  const effectiveBatchName = batchName || reportData?.batch?.name || `Batch_${cleanBatchId}`;

  if (!students || students.length === 0) {
    return {
      success: false,
      message: `No student records found to generate task report for "${effectiveBatchName}".`,
    };
  }

  // 1. Build Excel Rows
  // Column Name: Name of task
  // Row: Student Name
  const excelRows = students.map((st, idx) => {
    const row = {
      "S.No": idx + 1,
      "Roll Number": st.rollNo || `STU-${String(st.studentId).padStart(3, "0")}`,
      "Student Name": st.name,
      "Email": st.email || "—",
      "Department": st.department || "General",
    };

    // Columns for each Task Name
    tasks.forEach((t) => {
      const taskColName = t.title || `Task ${t.id}`;
      const taskInfo = st.tasks?.[t.id];
      if (taskInfo && taskInfo.submitted) {
        const score = Number(taskInfo.score || 0);
        const maxPoints = Number(taskInfo.maxPoints || t.points || 100);
        row[taskColName] = `${taskInfo.status || "Submitted"} (${score}/${maxPoints})`;
      } else {
        row[taskColName] = "Not Submitted";
      }
    });

    // Summary statistics columns
    row["Completed Tasks"] = `${st.completedTasks || 0}/${tasks.length}`;
    row["Total Score"] = st.totalScore || 0;
    row["Max Score"] = st.maxScore || 0;
    row["Completion Rate (%)"] = `${st.completionPercentage || 0}%`;

    return row;
  });

  // 2. Generate SheetJS Worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Auto-fit column widths
  const colKeys = Object.keys(excelRows[0] || {});
  worksheet["!cols"] = colKeys.map((k) => {
    let maxLen = k.length;
    excelRows.forEach((r) => {
      const val = r[k] ? String(r[k]) : "";
      if (val.length > maxLen) maxLen = val.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
  });

  // 3. Build Workbook
  const workbook = XLSX.utils.book_new();
  const safeSheetName = effectiveBatchName.slice(0, 31).replace(/[:\\/?*\[\]]/g, "_");
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  // 4. Download file
  const safeFileName = `${effectiveBatchName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Task_Report.xlsx`;
  XLSX.writeFile(workbook, safeFileName);

  return {
    success: true,
    message: `Task submission report for "${effectiveBatchName}" downloaded successfully!`,
  };
}

export default downloadBatchTaskReport;

