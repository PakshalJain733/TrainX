import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, LineChart, Users, ChevronDown, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Avatar, AvatarFallback } from "../../../components/ui/Avatar";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AD_Progress.css";

/* ── Inline dropdown for Admin Progress (CSS: AdminProgress.css .admin-prog-select-*) ── */
function AdminProgSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`admin-prog-select-wrap${isOpen ? ' admin-prog-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`admin-prog-select-trigger${isOpen ? ' admin-prog-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-prog-select-icon" />}
        <span className="admin-prog-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-prog-select-arrow${isOpen ? ' admin-prog-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="admin-prog-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-prog-select-option${isSel ? ' admin-prog-select-option--selected' : ''}`}>
                <span className="admin-prog-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-prog-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const API_BASE = "/api/v1";

function getAuthHeaders() {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminProgress() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [usersRes, batchesRes] = await Promise.all([
          fetch(`${API_BASE}/admin/users?role=student`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/batches`, { headers: getAuthHeaders() })
        ]);

        const usersData = await usersRes.json();
        const batchesData = await batchesRes.json();

        if (batchesData.success && Array.isArray(batchesData.data)) {
          setBatches(batchesData.data);
        }

        const studentUsers = usersData.success && Array.isArray(usersData.data) ? usersData.data : [];

        // Map student records with calculated progress & quiz averages
        const mappedStudents = studentUsers.map((s, idx) => ({
          id: s.id,
          name: s.name,
          initials: s.name ? s.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST',
          batch: s.batch_name || 'General Batch',
          quizAvg: s.quizAvg || 0,
          attendance: s.attendance || 0,
          codingRank: s.codingRank || idx + 1,
          xp: s.xp || 0,
        }));

        setStudents(mappedStudents);
      } catch (err) {
        console.error("Failed to load student progress:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = selectedBatch === "All Batches" ? students : students.filter(s => s.batch === selectedBatch);

  return (
    <div className="admin-progress-container">
      <SectionHeader
        icon={LineChart}
        title="Student Progress & Assessment Performance"
        description="Monitor student quiz scores, department metrics, and department coordinator analytics."
        action={
          <AdminProgSelect
            value={selectedBatch}
            onChange={setSelectedBatch}
            options={[
              { value: "All Batches", label: "All Batches" },
              ...batches.map(b => ({ value: b.name, label: b.name }))
            ]}
          />
        }
      />

      <Card className="progress-table-card">
        <CardContent className="progress-table-body">
          <table className="progress-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Batch</th>
                <th>Quiz Avg</th>
                <th>Attendance</th>
                <th>Coding Rank</th>
                <th>XP Points</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="admin-table-empty-cell">
                    No student progress records found.
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="progress-row">
                    <td>
                      <div className="progress-student-cell">
                        <Avatar size="32"><AvatarFallback>{s.initials}</AvatarFallback></Avatar>
                        <span className="progress-student-name">{s.name}</span>
                      </div>
                    </td>
                    <td><span className="progress-batch-pill">{s.batch}</span></td>
                    <td><span className={`progress-score ${s.quizAvg >= 85 ? "score-high" : s.quizAvg >= 70 ? "score-mid" : "score-low"}`}>{s.quizAvg}%</span></td>
                    <td><span className={`progress-score ${s.attendance >= 90 ? "score-high" : s.attendance >= 75 ? "score-mid" : "score-low"}`}>{s.attendance}%</span></td>
                    <td><span className="progress-rank">#{s.codingRank}</span></td>
                    <td><span className="progress-xp">{s.xp.toLocaleString()} XP</span></td>
                    <td>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ '--progress-fill': `${Math.min(s.xp / 25, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
