import { useEffect, useState } from "react";
import { Users, Search, Mail } from "lucide-react";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_Students.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const getStudents = (response) => {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.students)) return payload.students;
  return [];
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getAttendanceClass = (attendance) => {
  const value = asNumber(attendance);
  if (value === null) return "";
  if (value >= 90) return "mentor-student-attendance--green";
  if (value >= 75) return "mentor-student-attendance--amber";
  return "mentor-student-attendance--rose";
};

const getRiskClass = (status) => {
  if (status === "Top Performer") return "mentor-risk-pill--top";
  if (status === "Good") return "mentor-risk-pill--good";
  if (status === "Moderate Risk" || status === "Average") return "mentor-risk-pill--moderate";
  if (status === "High Risk" || status === "Needs Work") return "mentor-risk-pill--high";
  return "";
};

const formatPercent = (value) => {
  const number = asNumber(value);
  return number === null ? "N/A" : `${number}%`;
};

export default function Students() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch("/mentor/students/performance")
      .then((response) => {
        if (mounted) setStudents(getStudents(response));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = students.filter((student) => {
    const values = [student.name, student.rollNo, student.rollNumber, student.batch, student.department];
    return values.some((value) => textValue(value)?.toLowerCase().includes(query));
  });

  return (
    <div className="mentor-students-container">
      <div className="mentor-page-header">
        <div>
          <h2 className="mentor-page-title">
            <Users size={20} color="#4f46e5" />
            <span>Assigned Student Roster</span>
          </h2>
          <p className="mentor-page-subtitle">Your assigned students and the performance records returned by the mentor service</p>
        </div>
      </div>

      <div className="mentor-search-card">
        <div className="mentor-search-wrap">
          <Search size={16} className="mentor-search-icon" />
          <input
            type="text"
            placeholder="Search student name, roll number, or batch..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mentor-search-input"
          />
        </div>
      </div>

      <div className="mentor-table-card">
        <div className="mentor-table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll No</th>
                <th>Assigned Batch</th>
                <th>Attendance</th>
                <th>Avg Score</th>
                <th>Risk Level</th>
                <th className="mentor-actions-cell">Contact</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="mentor-students-empty">Loading assigned students...</div></td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((student, index) => {
                  const name = textValue(student.name) || "N/A";
                  const rollNo = textValue(student.rollNo || student.rollNumber) || "N/A";
                  const department = textValue(student.department) || "N/A";
                  const batch = textValue(student.batch || student.batchName) || "N/A";
                  const status = textValue(student.status) || "N/A";
                  const email = textValue(student.email);
                  const score = student.overallScore ?? student.score;
                  return (
                    <tr key={textValue(student.id || student.userId) || index}>
                      <td>
                        <p className="mentor-student-name">{name}</p>
                        <p className="mentor-student-college">{department}</p>
                      </td>
                      <td><span className="mentor-student-roll">{rollNo}</span></td>
                      <td><span className="mentor-student-batch">{batch}</span></td>
                      <td>
                        <span className={`mentor-student-attendance ${getAttendanceClass(student.attendance)}`}>
                          {formatPercent(student.attendance)}
                        </span>
                      </td>
                      <td><span className="mentor-student-score">{formatPercent(score)}</span></td>
                      <td>
                        <span className={`mentor-risk-pill ${getRiskClass(status)}`}>{status}</span>
                      </td>
                      <td className="mentor-actions-cell">
                        {email ? (
                          <a className="mentor-action-btn" href={`mailto:${email}`} title={email}>
                            <Mail size={13} />
                            <span>Contact</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="mentor-students-empty">
                      <Users size={28} />
                      <p>No records yet</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
