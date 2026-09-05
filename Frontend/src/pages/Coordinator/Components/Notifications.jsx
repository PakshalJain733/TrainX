import { useState } from "react";
import {
  Bell,
  Send,
  CheckCheck,
  Sparkles,
  Award,
  Bot,
  Terminal,
  CalendarCheck,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";

const defaultCoordinatorNotifications = [
  {
    id: 1,
    title: "New Student Coding Practice Submissions",
    body: "94 students from CSE 2026 Alpha Cohort completed the 'Two Sum Target Index Pair' coding practice assignment.",
    time: "15 min ago",
    category: "Coding Practice",
    icon: Terminal,
    iconColor: "#4f46e5",
    iconBg: "#e0e7ff",
    unread: true,
    actionLabel: "View Submissions",
    actionUrl: "/coordinator/practice",
  },
  {
    id: 2,
    title: "Attendance Alert: 6 High-Risk Defaulters Flagged",
    body: "Data Science & ML 2025 batch has 6 students below 75% mandatory attendance requirement. Advisory notices sent.",
    time: "2 hours ago",
    category: "Attendance",
    icon: AlertTriangle,
    iconColor: "#e11d48",
    iconBg: "#ffe4e6",
    unread: true,
    actionLabel: "View Defaulters",
    actionUrl: "/coordinator/improvement",
  },
  {
    id: 3,
    title: "AI Interview Performance Dossier Generated",
    body: "Week 35 AI mock interview drill completed across 3 department batches. Average technical score: 82.4%.",
    time: "5 hours ago",
    category: "AI Interview",
    icon: Bot,
    iconColor: "#7c3aed",
    iconBg: "#f5f3ff",
    unread: true,
    actionLabel: "View Interviews",
    actionUrl: "/coordinator/interviews",
  },
  {
    id: 4,
    title: "Placement Drive Live: Goldman Sachs & Morgan Stanley",
    body: "Registration portal is now active for FinTech Systems Coding Challenge for eligible 2025/2026 cohorts.",
    time: "Yesterday",
    category: "Placement",
    icon: Award,
    iconColor: "#059669",
    iconBg: "#ecfdf5",
    unread: false,
    actionLabel: "View Placement",
    actionUrl: "/coordinator/assessments",
  },
  {
    id: 5,
    title: "Weekly Governance Compliance Report Ready",
    body: "Audit logs for faculty session delivery, batch attendance, and coding assessments have been generated.",
    time: "2 days ago",
    category: "Governance",
    icon: Info,
    iconColor: "#0891b2",
    iconBg: "#ecfeff",
    unread: false,
    actionLabel: "View Reports",
    actionUrl: "/coordinator/reports",
  },
];

export default function CoordinatorNotifications() {
  const [notifications, setNotifications] = useState(defaultCoordinatorNotifications);
  const [filter, setFilter] = useState("All");
  const [broadcastText, setBroadcastText] = useState("");
  const [targetBatch, setTargetBatch] = useState("All Department Batches");

  const categories = ["All", "Unread", "Coding Practice", "Attendance", "AI Interview", "Placement", "Governance"];

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const deleteNotif = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const markSingleRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    const newNotif = {
      id: Date.now(),
      title: `Broadcast Sent to ${targetBatch}`,
      body: broadcastText,
      time: "Just now",
      category: "Coding Practice",
      icon: Send,
      iconColor: "#4f46e5",
      iconBg: "#e0e7ff",
      unread: false,
    };

    setNotifications([newNotif, ...notifications]);
    setBroadcastText("");
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filter === "Unread") return n.unread;
    if (filter === "All") return true;
    return n.category === filter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-2">
            <Bell size={14} className="text-indigo-600" />
            <span>Coordinator Activity & Broadcast Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Notifications & Broadcast Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Stay updated with student coding submission alerts, attendance notices, and send real-time broadcast announcements to department batches.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition cursor-pointer self-start md:self-auto"
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Broadcast Announcement Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Send size={16} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Send Real-time Department Broadcast</h3>
          </div>
          <span className="text-xs text-slate-400">Notifies all assigned students & mentors</span>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <textarea
              rows={2}
              required
              placeholder="Type your notice, coding practice reminder, or reschedule notice..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="md:col-span-3 w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
            <div className="flex flex-col justify-between gap-2">
              <select
                value={targetBatch}
                onChange={(e) => setTargetBatch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="All Department Batches">All Department Batches</option>
                <option value="CSE 2026 Alpha Cohort">CSE 2026 Alpha Cohort</option>
                <option value="Fullstack Web Dev Batch #4">Fullstack Web Dev Batch #4</option>
                <option value="Data Science & ML 2025">Data Science & ML 2025</option>
              </select>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition"
              >
                <Send size={14} /> Send Broadcast
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const count =
            c === "Unread"
              ? unreadCount
              : notifications.filter((n) => n.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                filter === c
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{c}</span>
              {c === "Unread" && unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List Stack */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
            <p className="text-xs text-slate-500">
              There are no pending notifications for filter "{filter}".
            </p>
          </div>
        ) : (
          filteredNotifs.map((item) => {
            const Icon = item.icon || Bell;
            return (
              <div
                key={item.id}
                onClick={() => item.unread && markSingleRead(item.id)}
                className={`bg-white p-5 rounded-2xl border transition flex items-start gap-4 cursor-pointer hover:border-indigo-200 ${
                  item.unread ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200/80"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: item.iconBg, color: item.iconColor }}
                >
                  <Icon size={20} />
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      {item.unread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600" title="Unread" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">{item.time}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-3">
                      {item.actionLabel && item.actionUrl && (
                        <Link
                          to={item.actionUrl}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          <span>{item.actionLabel}</span>
                          <ExternalLink size={12} />
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotif(item.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
