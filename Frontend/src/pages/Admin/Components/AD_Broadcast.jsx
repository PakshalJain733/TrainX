import React, { useState, useEffect, useRef } from "react";
import { Send, Bell, Trash2, Megaphone, CheckCircle2, ShieldAlert, Users, Calendar, AlertCircle, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import { addSharedBroadcast, getSharedBroadcasts, EVENTS } from "../../../utils/sharedStore";
import "../Styles/AD_Broadcast.css";

/* ── Inline dropdown for Admin Broadcast (CSS: AdminBroadcast.css .admin-bcast-select-*) ── */
function AdminBcastSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`admin-bcast-select-wrap${isOpen ? ' admin-bcast-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`admin-bcast-select-trigger${isOpen ? ' admin-bcast-select-trigger--open' : ''}`}>
        {Icon && <Icon className="admin-bcast-select-icon" />}
        <span className="admin-bcast-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`admin-bcast-select-arrow${isOpen ? ' admin-bcast-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="admin-bcast-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`admin-bcast-select-option${isSel ? ' admin-bcast-select-option--selected' : ''}`}>
                <span className="admin-bcast-select-option-label">{opt.label}</span>
                {isSel && <Check className="admin-bcast-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      let list = [];
      if (res && res.data && Array.isArray(res.data)) {
        list = res.data;
      }
      const shared = await getSharedBroadcasts([]);
      const existingIds = new Set(list.map((b) => String(b.id)));
      const sharedMapped = shared
        .filter((s) => !existingIds.has(String(s.id)))
        .map((s) => ({
          id: s.id,
          title: `📢 [Broadcast] ${s.title}`,
          desc: s.data?.message || s.description || '',
          body: s.data?.message || s.description || '',
          time: s.created_at ? new Date(s.created_at).toLocaleString() : "Today",
          unread: true,
          category: "Broadcast",
          priority: s.data?.priority || "High",
          target: s.data?.target_batch || s.target || "All Batches",
        }));
      setBroadcasts([...sharedMapped, ...list]);
    } catch (err) {
      console.error("Failed to fetch broadcast messages:", err);
      const shared = await getSharedBroadcasts([]);
      if (shared.length > 0) {
        setBroadcasts(
          shared.map((s) => ({
            id: s.id,
            title: `📢 [Broadcast] ${s.title}`,
            desc: s.data?.message || s.description || '',
            body: s.data?.message || s.description || '',
            time: s.created_at ? new Date(s.created_at).toLocaleString() : "Today",
            unread: true,
            category: "Broadcast",
            priority: s.data?.priority || "High",
            target: s.data?.target_batch || s.target || "All Batches",
          }))
        );
      }
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
    const handleUpdate = () => fetchBroadcasts();
    window.addEventListener(EVENTS.BROADCAST_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.BROADCAST_UPDATED, handleUpdate);
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

    await addSharedBroadcast({
      title: title.trim(),
      message: message.trim(),
      target_batch: target,
      author: "Admin Workspace",
    });

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
      <div className="ui-section-header-AD">
        <div className="ui-section-main">
          <div>
            <h2 className="ui-section-title">
              <Megaphone size={22} className="ui-section-title-icon" />
              <span>Broadcast Announcement Center</span>
            </h2>
            <p className="ui-section-desc">
              Issue real-time announcements, urgent test notices, and placement drive alerts to all student cohorts and mentors.
            </p>
          </div>
        </div>
      </div>

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
                <AdminBcastSelect
                  value={target}
                  onChange={setTarget}
                  options={[
                    { value: "All Batches & Enrolled Users", label: "All Batches & Enrolled Users" },
                    { value: "Students Only", label: "Students Only" },
                    { value: "Mentors & Coordinators Only", label: "Mentors & Coordinators Only" },
                    ...batches.map((b) => ({ value: b.name, label: `Cohort: ${b.name}` })),
                  ]}
                />
              </div>

              <div className="form-group">
                <label>Notice Priority Level</label>
                <AdminBcastSelect
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: "General Announcement", label: "General Announcement" },
                    { value: "Urgent Notice", label: "Urgent Notice" },
                    { value: "Exam & Quiz Schedule", label: "Exam & Quiz Schedule" },
                    { value: "Placement Drive Alert", label: "Placement Drive Alert" },
                  ]}
                />
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
