import React, { useState, useEffect, useRef } from "react";
import { Send, Bell, Trash2, Megaphone, CheckCircle2, Users, Calendar, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import { addSharedBroadcast, getSharedBroadcasts, EVENTS } from "../../../utils/sharedStore";
import "../Styles/MN_Broadcast.css";

function MentorBcastSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`mentor-bcast-select-wrap${isOpen ? ' mentor-bcast-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`mentor-bcast-select-trigger${isOpen ? ' mentor-bcast-select-trigger--open' : ''}`}>
        {Icon && <Icon className="mentor-bcast-select-icon" />}
        <span className="mentor-bcast-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`mentor-bcast-select-arrow${isOpen ? ' mentor-bcast-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="mentor-bcast-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`mentor-bcast-select-option${isSel ? ' mentor-bcast-select-option--selected' : ''}`}>
                <span className="mentor-bcast-select-option-label">{opt.label}</span>
                {isSel && <Check className="mentor-bcast-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MentorBroadcast() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("All Allocated Batches");
  const [priority, setPriority] = useState("General Announcement");

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/mentor/broadcast");
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
          target: s.data?.target_batch || s.target || "All Allocated Batches",
        }));
      setBroadcasts([...sharedMapped, ...list]);
    } catch (err) {
      console.error("Failed to fetch mentor broadcast messages:", err);
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
            target: s.data?.target_batch || s.target || "All Allocated Batches",
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
      author: "Mentor Workspace",
    });

    try {
      const res = await apiFetch("/mentor/broadcast", {
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

        window.dispatchEvent(new CustomEvent("new_broadcast_notification", { detail: newNotif }));

        setTitle("");
        setMessage("");
        setSuccessMsg("Broadcast announcement published successfully to your allocated cohorts!");
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
      await apiFetch(`/mentor/broadcast/${id}`, {
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
    <div className="mentor-broadcast-container">
      {/* Custom Mentor Header inline */}
      <div className="mentor-broadcast-page-header">
        <div>
          <h2 className="mentor-broadcast-page-title">
            <Megaphone size={20} color="#4f46e5" />
            <span>Mentor Broadcast Announcement Center</span>
          </h2>
          <p className="mentor-broadcast-page-subtitle">
            Publish real-time announcements, lecture reschedules, and lab notices to your assigned student batches.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="mentor-broadcast-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Send Broadcast Form Card */}
      <Card className="mentor-broadcast-form-card">
        <CardContent>
          <div className="mentor-broadcast-card-title">
            <Megaphone size={20} className="mentor-broadcast-title-icon" />
            <h3>Broadcast Notice to Assigned Batches</h3>
          </div>

          <form onSubmit={handleSend} className="mentor-broadcast-form">
            <div className="mentor-broadcast-form-group">
              <label>Notice Title / Headline *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lab Session Shifted to Lab 402 @ 2:00 PM"
                required
              />
            </div>

            <div className="mentor-broadcast-form-row">
              <div className="mentor-broadcast-form-group">
                <label>Target Cohort</label>
                <MentorBcastSelect
                  value={target}
                  onChange={setTarget}
                  options={[
                    { value: "All Allocated Batches", label: "All Allocated Batches" },
                    ...batches.map((b) => ({ value: b.name, label: `Cohort: ${b.name}` })),
                  ]}
                />
              </div>

              <div className="mentor-broadcast-form-group">
                <label>Notice Priority Level</label>
                <MentorBcastSelect
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

            <div className="mentor-broadcast-form-group">
              <label>Broadcast Notice Description *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your batch announcement details here..."
                required
              />
            </div>

            <button type="submit" className="mentor-broadcast-send-btn" disabled={sending}>
              <Send size={15} /> {sending ? "Publishing..." : "Publish Broadcast Now"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Broadcast History Card */}
      <Card className="mentor-broadcast-history-card">
        <CardContent>
          <div className="mentor-broadcast-card-title">
            <Bell size={20} className="mentor-broadcast-title-icon" />
            <h3>Broadcast History & Published Notices</h3>
          </div>

          <div className="mentor-broadcast-list">
            {loading ? (
              <div className="mentor-broadcast-empty-state">Loading broadcast logs...</div>
            ) : broadcasts.length === 0 ? (
              <div className="mentor-broadcast-empty-state">
                <Megaphone size={32} />
                <p>No broadcast announcements sent yet.</p>
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="mentor-broadcast-item">
                  <div className="mentor-broadcast-item-left">
                    <div className="mentor-broadcast-item-header">
                      <h4 className="mentor-broadcast-item-title">{b.title}</h4>
                      <Badge variant={priorityVariant(b.priority)}>{b.priority}</Badge>
                    </div>
                    <p className="mentor-broadcast-item-body">{b.message || b.desc || b.body}</p>
                    <div className="mentor-broadcast-item-meta">
                      <span className="mentor-broadcast-meta-target">
                        <Users size={12} /> Target: <strong>{b.target}</strong>
                      </span>
                      <span className="mentor-broadcast-meta-time">
                        <Calendar size={12} /> {b.created_at ? new Date(b.created_at).toLocaleString() : b.time || "Just now"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mentor-broadcast-delete-btn"
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
