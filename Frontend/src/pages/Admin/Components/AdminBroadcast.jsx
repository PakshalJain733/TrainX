import React, { useState, useEffect } from "react";
import { Send, Bell, Trash2, Megaphone, CheckCircle2, ShieldAlert, Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../Styles/AdminBroadcast.css";

export default function AdminBroadcast() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("All Batches & Enrolled Users");
  const [priority, setPriority] = useState("General Announcement");

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/broadcast");
      if (res && res.data && Array.isArray(res.data)) {
        setBroadcasts(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch broadcast messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await apiFetch("/batches");
      if (res && res.data && Array.isArray(res.data)) {
        setBatches(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    fetchBatches();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    setSuccessMsg("");

    const payload = {
      title: title.trim(),
      message: message.trim(),
      target,
      priority,
    };

    try {
      const res = await apiFetch("/admin/broadcast", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        const newNotif = {
          id: res.data.id || Date.now(),
          type: "alert",
          title: `📢 [Broadcast] ${title.trim()}`,
          desc: message.trim(),
          body: message.trim(),
          time: "Just now",
          unread: true,
          category: "Broadcast",
          priority: priority,
          target: target,
        };

        // Sync with localStorage
        try {
          const stored = JSON.parse(localStorage.getItem("app_broadcast_notifications") || "[]");
          localStorage.setItem("app_broadcast_notifications", JSON.stringify([newNotif, ...stored]));
        } catch (err) {}

        // Trigger real-time popup & navbar notification badge update
        window.dispatchEvent(new CustomEvent("new_broadcast_notification", { detail: newNotif }));

        setTitle("");
        setMessage("");
        setSuccessMsg("Broadcast notice sent successfully to all selected target audiences!");
        setTimeout(() => setSuccessMsg(""), 4000);
        fetchBroadcasts();
      }
    } catch (err) {
      console.error("Failed to send broadcast:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/admin/broadcast/${id}`, {
        method: "DELETE",
      });
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete broadcast message:", err);
    }
  };

  const priorityVariant = (p) => {
    if (p === "Urgent Notice" || p === "Placement Drive Alert") return "destructive";
    if (p === "Exam & Quiz Schedule") return "default";
    return "secondary";
  };

  return (
    <div className="admin-broadcast-container">
      <SectionHeader
        eyebrow="Communication & Alerts"
        title="Broadcast Announcement Center"
        description="Issue real-time announcements, urgent test notices, and placement drive alerts to all student cohorts and mentors."
      />

      {successMsg && (
        <div className="broadcast-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Send Broadcast Form Card */}
      <Card className="broadcast-form-card">
        <CardContent>
          <div className="broadcast-card-title">
            <Megaphone size={20} className="broadcast-title-icon" />
            <h3>Send Real-time Broadcast Notice</h3>
          </div>

          <form onSubmit={handleSend} className="broadcast-form">
            <div className="form-group">
              <label>Notice Title / Headline *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IA-2 Quiz Rescheduled to Friday 10:00 AM"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Target Audience</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="All Batches & Enrolled Users">All Batches & Enrolled Users</option>
                  <option value="Students Only">Students Only</option>
                  <option value="Mentors & Coordinators Only">Mentors & Coordinators Only</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>
                      Cohort: {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notice Priority Level</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="General Announcement">General Announcement</option>
                  <option value="Urgent Notice">Urgent Notice</option>
                  <option value="Exam & Quiz Schedule">Exam & Quiz Schedule</option>
                  <option value="Placement Drive Alert">Placement Drive Alert</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Broadcast Message Body *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your notice description or announcement message here..."
                required
              />
            </div>

            <button type="submit" className="broadcast-send-btn" disabled={sending}>
              <Send size={15} /> {sending ? "Broadcasting..." : "Send Broadcast Now"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Broadcast Logs History Card */}
      <Card className="broadcast-history-card">
        <CardContent>
          <div className="broadcast-card-title">
            <Bell size={20} className="broadcast-title-icon" />
            <h3>Broadcast History & Sent Logs</h3>
          </div>

          <div className="broadcast-list">
            {loading ? (
              <div className="broadcast-empty-state">Loading broadcast logs...</div>
            ) : broadcasts.length === 0 ? (
              <div className="broadcast-empty-state">
                <Megaphone size={32} />
                <p>No broadcast announcements sent yet.</p>
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="broadcast-item">
                  <div className="broadcast-item-left">
                    <div className="broadcast-item-header">
                      <h4 className="broadcast-item-title">{b.title}</h4>
                      <Badge variant={priorityVariant(b.priority)}>{b.priority}</Badge>
                    </div>
                    <p className="broadcast-item-body">{b.message}</p>
                    <div className="broadcast-item-meta">
                      <span className="broadcast-meta-target">
                        <Users size={12} /> Target: <strong>{b.target}</strong>
                      </span>
                      <span className="broadcast-meta-time">
                        <Calendar size={12} /> {b.created_at ? new Date(b.created_at).toLocaleString() : "Just now"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="broadcast-delete-btn"
                    onClick={() => handleDelete(b.id)}
                    title="Delete Broadcast Log"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
