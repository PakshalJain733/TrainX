import React, { useState, useEffect, useRef } from "react";
import { Send, Bell, Trash2, Megaphone, CheckCircle2, Users, Calendar, ChevronDown, Check } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { apiFetch } from "../../../utils/api";
import { addSharedBroadcast, getSharedBroadcasts, deleteSharedItem, EVENTS } from "../../../utils/sharedStore";
import "../Styles/CO_Broadcast.css";

function CoordinatorBcastSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`coordination-bcast-select-wrap${isOpen ? ' coordination-bcast-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`coordination-bcast-select-trigger${isOpen ? ' coordination-bcast-select-trigger--open' : ''}`}>
        {Icon && <Icon className="coordination-bcast-select-icon" />}
        <span className="coordination-bcast-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`coordination-bcast-select-arrow${isOpen ? ' coordination-bcast-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="coordination-bcast-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`coordination-bcast-select-option${isSel ? ' coordination-bcast-select-option--selected' : ''}`}>
                <span className="coordination-bcast-select-option-label">{opt.label}</span>
                {isSel && <Check className="coordination-bcast-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorBroadcast() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("Entire Department & Students");
  const [priority, setPriority] = useState("General Announcement");

  const [isDispatched, setIsDispatched] = useState(false);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/coordinator/broadcast");
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
          target: s.data?.target_batch || s.target || "Entire Department & Students",
        }));
      setBroadcasts([...sharedMapped, ...list]);
    } catch (err) {
      console.error("Failed to fetch coordinator broadcast messages:", err);
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
            target: s.data?.target_batch || s.target || "Entire Department & Students",
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
    setIsDispatched(false);

    const payload = {
      title: title.trim(),
      message: message.trim(),
      target_batch: target,
      priority: priority,
      author: "Coordinator Workspace",
    };

    try {
      const created = await addSharedBroadcast(payload);

      try {
        await apiFetch("/coordinator/broadcast", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch (_) {
        // Fallback handled by addSharedBroadcast
      }

      const newNotif = {
        id: created?.id || Date.now(),
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
      setIsDispatched(true);
      setSuccessMsg("Dispatched Successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setIsDispatched(false);
      }, 4000);
      await fetchBroadcasts();
    } catch (err) {
      console.error("Failed to send broadcast:", err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSharedItem(id);
      try {
        await apiFetch(`/coordinator/broadcast/${id}`, {
          method: "DELETE",
        });
      } catch (_) {}
      setBroadcasts((prev) => prev.filter((b) => String(b.id) !== String(id)));
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
    <div className="coordinator-broadcast-container">
      {/* Inline Coordinator Broadcast Page Header */}
      <div className="coordinator-broadcast-page-header">
        <div>
          <h2 className="coordinator-broadcast-page-title">
            <Megaphone size={20} color="#0284c7" />
            <span>Department Coordinator Broadcast Center</span>
          </h2>
          <p className="coordinator-broadcast-page-subtitle">
            Broadcast academic schedules, urgent exam alerts, and department governance notices to mentors and students.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="coordinator-broadcast-alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Send Broadcast Form Card */}
      <Card className="coordinator-broadcast-form-card">
        <CardContent>
          <div className="coordinator-broadcast-card-title">
            <Megaphone size={20} className="coordinator-broadcast-title-icon" />
            <h3>Dispatch Departmental Broadcast Notice</h3>
          </div>

          <form onSubmit={handleSend} className="coordinator-broadcast-form">
            <div className="coordinator-broadcast-form-group">
              <label>Notice Title / Headline *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Mid-Semester Exam Schedule & Hall Ticket Issuance"
                required
              />
            </div>

            <div className="coordinator-broadcast-form-row">
              <div className="coordinator-broadcast-form-group">
                <label>Target Audience</label>
                <CoordinatorBcastSelect
                  value={target}
                  onChange={setTarget}
                  options={[
                    { value: "Entire Department & Students", label: "Entire Department & Students" },
                    { value: "Department Mentors Only", label: "Department Mentors Only" },
                    ...batches.map((b) => ({ value: b.name, label: `Batch: ${b.name}` })),
                  ]}
                />
              </div>

              <div className="coordinator-broadcast-form-group">
                <label>Notice Priority Level</label>
                <CoordinatorBcastSelect
                  value={priority}
                  onChange={setPriority}
                  options={[
                    { value: "General Announcement", label: "General Announcement" },
                    { value: "Urgent Notice", label: "Urgent Notice" }
                  ]}
                />
              </div>
            </div>

            <div className="coordinator-broadcast-form-group">
              <label>Broadcast Message Body *</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your official department notice description here..."
                required
              />
            </div>

            <button
              type="submit"
              className={`coordinator-broadcast-send-btn ${isDispatched ? "dispatched-success-btn" : ""}`}
              disabled={sending}
            >
              {sending ? (
                "Broadcasting..."
              ) : isDispatched ? (
                <><CheckCircle2 size={16} /> Dispatched Successfully</>
              ) : (
                <><Send size={15} /> Dispatch Notice Now</>
              )}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Broadcast Logs Card */}
      <Card className="coordinator-broadcast-history-card">
        <CardContent>
          <div className="coordinator-broadcast-card-title">
            <Bell size={20} className="coordinator-broadcast-title-icon" />
            <h3>Department Broadcast History Logs</h3>
          </div>

          <div className="coordinator-broadcast-list">
            {loading ? (
              <div className="coordinator-broadcast-empty-state">Loading broadcast logs...</div>
            ) : broadcasts.length === 0 ? (
              <div className="coordinator-broadcast-empty-state">
                <Megaphone size={32} />
                <p>No departmental announcements published yet.</p>
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="coordinator-broadcast-item">
                  <div className="coordinator-broadcast-item-left">
                    <div className="coordinator-broadcast-item-header">
                      <h4 className="coordinator-broadcast-item-title">{b.title}</h4>
                      <Badge variant={priorityVariant(b.priority)}>{b.priority}</Badge>
                    </div>
                    <p className="coordinator-broadcast-item-body">{b.message || b.desc || b.body}</p>
                    <div className="coordinator-broadcast-item-meta">
                      <span className="coordinator-broadcast-meta-target">
                        <Users size={12} /> Target: <strong>{b.target}</strong>
                      </span>
                      <span className="coordinator-broadcast-meta-time">
                        <Calendar size={12} /> {b.created_at ? new Date(b.created_at).toLocaleString() : b.time || "Just now"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="coordinator-broadcast-delete-btn"
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
