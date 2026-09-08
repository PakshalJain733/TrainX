import React, { useState, useEffect } from "react";
import { TrendingUp, Users, Search, AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Eye, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/Tabs";
import { apiFetch } from "../../../utils/api";
import "../Styles/AdminProgress.css";

// ── Mini bar helper ───────────────────────────────────────────────────────
function MiniBar({ value, target = 70 }) {
  const isWeak = value < target;
  const color = isWeak ? "#ef4444" : "#10b981";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 28 }}>{value}%</span>
      <div style={{ flex: 1, height: 6, backgroundColor: "rgba(148,163,184,0.2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Status helper ───────────────────────────────────────────────────────────
function statusStyle(score) {
  if (score >= 85) return { label: "Excellent", color: "#10b981", bg: "rgba(16,185,129,0.12)" };
  if (score >= 70) return { label: "Good", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  if (score >= 55) return { label: "Average", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { label: "Needs Work", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
}

// ── Student Detail Panel ───────────────────────────────────────────────────
function StudentDetailPanel({ student, onClose }) {
  if (!student) return null;
  const { color: oc } = statusStyle(student.overallScore);

  return (
    <div className="admin-perf-detail-panel" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{student.name} ({student.roll})</h3>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{student.department} · {student.batch}</p>
        </div>
        <button onClick={onClose} style={{ padding: "6px 12px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          Close Report
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Overall Score", value: `${student.overallScore}%`, color: oc },
          { label: "Quiz Avg", value: `${student.quiz}%` },
          { label: "Coding Avg", value: `${student.coding}%` },
          { label: "Interview", value: `${student.interview}%` },
          { label: "Attendance", value: `${student.attendance}%` },
          { label: "Progress", value: `${student.progress}%` },
        ].map((k, i) => (
          <div key={i} style={{ padding: 12, backgroundColor: "#f8fafc", borderRadius: 6, border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: k.color || "#0f172a" }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} color="#f59e0b" /> Weak Areas
          </h4>
          {student.weakAreas && student.weakAreas.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {student.weakAreas.map((w, i) => (
                <div key={i} style={{ padding: 12, border: "1px solid #fecaca", backgroundColor: "#fef2f2", borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, color: "#b91c1c", fontSize: 13 }}>{w.skill}</div>
                  <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>Score: {w.score}% (Target: {w.target}%)</div>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "#10b981" }}>No major weak areas detected.</span>
          )}
        </div>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color="#10b981" /> Strong Areas
          </h4>
          {student.strongAreas && student.strongAreas.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {student.strongAreas.map((s, i) => (
                <div key={i} style={{ padding: 12, border: "1px solid #a7f3d0", backgroundColor: "#ecfdf5", borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, color: "#047857", fontSize: 13 }}>{s}</div>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: "#64748b" }}>Not enough data.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiFetch("/admin/performance")
      .then(res => {
        if (res && res.data) {
          setData(res.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", color: "#64748b" }}>
        <RefreshCw size={28} style={{ animation: "spin 1.2s linear infinite", color: "#4f46e5", marginBottom: 14 }} />
        <p>Loading college performance data...</p>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  if (!data) return <div>Failed to load performance data.</div>;

  const { overview, departments, batches, students } = data;

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || s.department === deptFilter;
    const matchBatch = batchFilter === "All" || s.batch === batchFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchDept && matchBatch && matchStatus;
  });

  const uniqueDepts = ["All", ...new Set(students.map(s => s.department))];
  const uniqueBatches = ["All", ...new Set(students.map(s => s.batch))];

  return (
    <div className="admin-progress-container" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionHeader
        eyebrow="College Admin Dashboard"
        title="Performance Analysis"
        description="Monitor student academic and technical performance across departments and batches."
      />

      {/* ── Overview ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Total Students</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{overview.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Avg College Performance</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4f46e5" }}>{overview.averagePerformance}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>High Performing</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>{overview.highPerforming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent style={{ padding: "20px" }}>
            <div style={{ color: "#64748b", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Needs Improvement</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{overview.needsImprovement}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Student Analytics</TabsTrigger>
          <TabsTrigger value="departments">Department Analytics</TabsTrigger>
          <TabsTrigger value="batches">Batch Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="students" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {selectedStudent && <StudentDetailPanel student={selectedStudent} onClose={() => setSelectedStudent(null)} />}

          <Card>
            <CardHeader style={{ padding: "20px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "#94a3b8" }} />
                  <input
                    type="text"
                    placeholder="Search name or roll..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ padding: "8px 12px 8px 32px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, outline: "none", width: 220 }}
                  />
                </div>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, outline: "none" }}>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
                </select>
                <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, outline: "none" }}>
                  {uniqueBatches.map(b => <option key={b} value={b}>{b === "All" ? "All Batches" : b}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, outline: "none" }}>
                  <option value="All">All Statuses</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Needs Work">Needs Work</option>
                </select>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Student</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Overall</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Quiz</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Coding</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Interview</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Attendance</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>No students found matching your filters.</td></tr>
                  ) : (
                    filteredStudents.map(s => {
                      const { label, color, bg } = statusStyle(s.overallScore);
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{s.roll} · {s.department}</div>
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 800, color: color }}>{s.overallScore}%</td>
                          <td style={{ padding: "12px 16px" }}><MiniBar value={s.quiz} target={75} /></td>
                          <td style={{ padding: "12px 16px" }}><MiniBar value={s.coding} target={70} /></td>
                          <td style={{ padding: "12px 16px" }}><MiniBar value={s.interview} target={65} /></td>
                          <td style={{ padding: "12px 16px" }}><MiniBar value={s.attendance} target={75} /></td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge style={{ backgroundColor: bg, color: color, padding: "2px 8px", border: "none", fontSize: 11, fontWeight: 700 }}>{label}</Badge>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button onClick={() => setSelectedStudent(s)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                              <Eye size={14} /> Report
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader><CardTitle>Department Analytics</CardTitle></CardHeader>
            <CardContent style={{ padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Department</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Students</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Avg Performance</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Avg Quiz</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Avg Coding</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Needs Attention</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{d.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>{d.students}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#4f46e5" }}>{d.avgPerformance}%</td>
                      <td style={{ padding: "12px 16px" }}><MiniBar value={d.avgQuiz} target={75} /></td>
                      <td style={{ padding: "12px 16px" }}><MiniBar value={d.avgCoding} target={70} /></td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#ef4444" }}>{d.needsAttention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches">
          <Card>
            <CardHeader><CardTitle>Batch Analytics</CardTitle></CardHeader>
            <CardContent style={{ padding: 0, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Batch</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Students</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Avg Performance</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Avg Progress</th>
                    <th style={{ padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Needs Attention</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map(b => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a", fontSize: 14 }}>{b.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>{b.students}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#4f46e5" }}>{b.avgPerformance}%</td>
                      <td style={{ padding: "12px 16px" }}><MiniBar value={b.avgProgress} target={70} /></td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#ef4444" }}>{b.needsAttention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
