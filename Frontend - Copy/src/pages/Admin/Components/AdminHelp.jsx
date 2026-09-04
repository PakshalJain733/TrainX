import React, { useState } from "react";
import { MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import "../Styles/AdminHelp.css";

const initialTickets = [
  { id: 1, title: "Cannot access Python Batch materials", student: "Priya Sharma", batch: "Python Backend", status: "Open", time: "10 min ago", priority: "High" },
  { id: 2, title: "Quiz 2 marks not updated", student: "Kabir Menon", batch: "React Frontend", status: "Open", time: "1h ago", priority: "Medium" },
  { id: 3, title: "Attendance wrongly marked absent", student: "Ananya Rao", batch: "Full Stack", status: "In Progress", time: "2h ago", priority: "Medium" },
  { id: 4, title: "Leaderboard not showing correct rank", student: "Siddharth Verma", batch: "Python Backend", status: "Resolved", time: "Yesterday", priority: "Low" },
  { id: 5, title: "Video content not loading on mobile", student: "Riya Shah", batch: "Data Science", status: "Resolved", time: "2 days ago", priority: "Low" },
];

const statusVariant = (s) => s === "Open" ? "destructive" : s === "In Progress" ? "default" : "success";
const priorityColor = (p) => p === "High" ? "#dc2626" : p === "Medium" ? "#d97706" : "#64748b";

export default function AdminHelp() {
  const [tickets, setTickets] = useState(initialTickets);

  const resolve = (id) => setTickets(tickets.map(t => t.id === id ? { ...t, status: "Resolved" } : t));

  const open = tickets.filter(t => t.status === "Open").length;
  const inProgress = tickets.filter(t => t.status === "In Progress").length;
  const resolved = tickets.filter(t => t.status === "Resolved").length;

  return (
    <div className="admin-help-container">
      <div className="help-header-row">
        <div>
          <h2 className="help-title">Support Tickets</h2>
          <p className="help-subtitle">Manage student help requests and resolve issues.</p>
        </div>
        <div className="help-stats">
          <span className="help-stat-badge help-stat-open">{open} Open</span>
          <span className="help-stat-badge help-stat-inprogress">{inProgress} In Progress</span>
          <span className="help-stat-badge help-stat-resolved">{resolved} Resolved</span>
        </div>
      </div>

      <div className="help-tickets-list">
        {tickets.map(t => (
          <Card key={t.id} className={`help-ticket-card ${t.status === "Resolved" ? "ticket-resolved" : ""}`}>
            <CardContent className="help-ticket-body">
              <div className="ticket-icon-wrap">
                {t.status === "Resolved" ? <CheckCircle2 size={18} className="ticket-icon-resolved" /> : <MessageSquare size={18} className="ticket-icon-open" />}
              </div>
              <div className="ticket-info">
                <h4 className="ticket-title">{t.title}</h4>
                <div className="ticket-meta">
                  <span className="ticket-student">{t.student}</span>
                  <span className="ticket-sep">·</span>
                  <span className="ticket-batch">{t.batch}</span>
                  <span className="ticket-sep">·</span>
                  <Clock size={12} className="ticket-clock" />
                  <span className="ticket-time">{t.time}</span>
                </div>
              </div>
              <div className="ticket-right">
                <span className="ticket-priority" style={{ color: priorityColor(t.priority) }}>
                  <AlertCircle size={13} /> {t.priority}
                </span>
                <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                {t.status !== "Resolved" && (
                  <button className="ticket-resolve-btn" onClick={() => resolve(t.id)}>Mark Resolved</button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
