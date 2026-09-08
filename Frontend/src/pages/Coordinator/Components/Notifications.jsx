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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Notifications & Broadcast Alerts
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Stay updated with student coding submission alerts and attendance notices.
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
