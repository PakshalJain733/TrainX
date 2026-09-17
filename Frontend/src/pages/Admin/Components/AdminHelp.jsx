import React, { useState } from "react";
import { MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import "../Styles/AdminHelp.css";

const initialTickets = [];

const statusVariant = (s) => s === "Open" ? "destructive" : s === "In Progress" ? "default" : "success";
const priorityClass = (p) => p === "High" ? "ticket-priority--high" : p === "Medium" ? "ticket-priority--med" : "ticket-priority--low";

export default function AdminHelp() {
  const [tickets, setTickets] = useState(initialTickets);

  const resolve = (id) => setTickets(tickets.map(t => t.id === id ? { ...t, status: "Resolved" } : t));

  const open = tickets.filter(t => t.status === "Open").length;
  const inProgress = tickets.filter(t => t.status === "In Progress").length;
  const resolved = tickets.filter(t => t.status === "Resolved").length;

  return (
    <div className="admin-help-container">
      <SectionHeader
        title="Support Tickets"
        description="Manage student help requests and resolve issues."
        action={
          <div className="help-stats">
            <span className="help-stat-badge help-stat-open">{open} Open</span>
            <span className="help-stat-badge help-stat-inprogress">{inProgress} In Progress</span>
            <span className="help-stat-badge help-stat-resolved">{resolved} Resolved</span>
          </div>
        }
      />

      <div className="help-tickets-list">
        {tickets.length === 0 ? (
          <div className="admin-empty-state-card">
            <MessageSquare size={36} className="admin-empty-state-icon" />
            <p className="admin-empty-state-title">No support tickets found</p>
            <p className="admin-empty-state-sub">Student issues and help requests will appear here.</p>
          </div>
        ) : (
          tickets.map(t => (
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
                  <span className={`ticket-priority ${priorityClass(t.priority)}`}>
                    <AlertCircle size={13} /> {t.priority}
                  </span>
                  <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                  {t.status !== "Resolved" && (
                    <button className="ticket-resolve-btn" onClick={() => resolve(t.id)}>Mark Resolved</button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
