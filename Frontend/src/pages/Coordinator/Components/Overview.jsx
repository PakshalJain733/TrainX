import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  UserCheck,
  LineChart,
  PlusCircle,
  AlertTriangle,
  Send,
  CheckCircle,
  Sparkles,
  Info,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { apiFetch } from "../../../utils/api";
import "../../Student/Styles/Overview.css";

export default function CoordinatorOverview() {
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [targetAudience, setTargetAudience] = useState("All Batches & Students");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "Coordinator",
    department: "Engineering & Technology",
    college: "Campus Training Portal",
  });
  const [stats, setStats] = useState([
    { label: "Enrolled Students", value: "0", hint: "Active in department", icon: GraduationCap },
    { label: "Managed Batches", value: "0 Batches", hint: "Current active batches", icon: Users },
    { label: "Faculty & Mentors", value: "0 Trainers", hint: "Assigned department mentors", icon: UserCheck },
    { label: "Attendance Rate", value: "0%", hint: "Department average", icon: LineChart },
  ]);
  const [highRiskStudents, setHighRiskStudents] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch("/coordinator/overview");
        if (res && res.success && res.data) {
          const d = res.data;
          if (d.profile) setProfile(d.profile);
          if (d.highRiskStudents) setHighRiskStudents(d.highRiskStudents);
          if (d.stats && Array.isArray(d.stats)) {
            const icons = [GraduationCap, Users, UserCheck, LineChart];
            setStats(d.stats.map((s, idx) => ({
              ...s,
              icon: icons[idx % icons.length],
            })));
          }
        }
      } catch (err) {
        console.warn("Failed to load coordinator overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    try {
      await apiFetch("/coordinator/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: "Department Notice",
          message: broadcastMsg,
          target: targetAudience,
        }),
      });
      setBroadcastSent(true);
      setBroadcastMsg("");
      setTimeout(() => setBroadcastSent(false), 3000);
    } catch (err) {
      alert("Failed to send broadcast: " + err.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return "CO";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="student-page-inner stack-6 overview-wrapper">
      {/* Radiant Welcome Hero Banner */}
      <div className="overview-hero-card">
        <div className="overview-hero-left">
          <div className="overview-hero-avatar">
            {getInitials(profile.name)}
          </div>
          <div>
            <div className="overview-hero-eyebrow">
              <Sparkles size={13} /> COORDINATOR WORKSPACE DASHBOARD
            </div>
            <h1 className="overview-hero-title">
              Welcome back, {profile.name}!
            </h1>
            <p className="overview-hero-desc">
              Department Coordinator · {profile.department} | {profile.college}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards Row */}
      <div className="overview-grid-4">
        {stats.map((s) => (
          <Card key={s.label} className="overview-stat-card shadow-sm">
            <CardContent className="overview-card-content">
              <div className="overview-stat-top">
                <div className="overview-icon-container">
                  <s.icon size={16} />
                </div>
                <span className="overview-stat-label">{s.label}</span>
                <Info size={15} className="overview-info-icon" />
              </div>

              <p className="overview-stat-value">{s.value}</p>

              <div className="overview-stat-hint-row">
                <span className="overview-stat-trend-pill">{s.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2-Column Main Arena */}
      <div className="overview-split-grid">
        {/* Left: Broadcast Announcement Form */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap">
                <Send size={18} className="overview-header-icon" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Broadcast Department Notice</CardTitle>
                <CardDescription className="overview-card-desc">Send instant announcements to students & cohorts</CardDescription>
              </div>
            </div>
            <Badge variant="outline">{profile.department}</Badge>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleBroadcast} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="All Batches & Students">All Department Batches & Students</option>
                  <option value="Third Year Batches">Third Year Batches</option>
                  <option value="Final Year Batches">Final Year Batches</option>
                  <option value="Defaulter Students">Flagged Defaulter Students Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Notice Message</label>
                <textarea
                  rows={4}
                  placeholder="Type notice message (e.g., IA-2 Quiz rescheduled to Friday 10 AM)..."
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5">
                  <Send size={14} /> Send Announcement
                </Button>
                {broadcastSent && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={15} /> Sent successfully!
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right: Flagged High Risk Students */}
        <Card className="overview-subcard">
          <CardHeader className="overview-card-header-between">
            <div className="overview-header-left">
              <div className="overview-header-icon-wrap overview-header-icon-wrap--trophy">
                <AlertTriangle size={18} className="overview-header-icon text-rose-500" />
              </div>
              <div>
                <CardTitle className="overview-card-title">Defaulter & Risk Audit</CardTitle>
                <CardDescription className="overview-card-desc">Students requiring intervention</CardDescription>
              </div>
            </div>
            <Link to="/coordinator/students" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5">
            {highRiskStudents.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle size={28} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-semibold">No high risk students flagged.</p>
              </div>
            ) : (
              highRiskStudents.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">{s.name}</h5>
                    <p className="text-[11px] text-slate-500">{s.rollNumber} · {s.batch}</p>
                    <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
                      Attendance: {s.attendance} | Performance: {s.avgScore}
                    </span>
                  </div>
                  <Badge variant="destructive" className="text-[10px]">{s.riskStatus}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
