import React, { useState, useEffect } from "react";
import { Briefcase, Award, Users, CheckCircle, Plus, Sparkles, ChevronDown, Check } from "lucide-react";
import api from "../../../services/api";
import { addSharedDrive, getSharedDrives, EVENTS } from "../../../utils/sharedStore";
import "../Styles/Placement.css";

/* ── Inline dropdown for Coordinator Placement (CSS: Placement.css .coord-place-select-*) ── */
function CoordPlaceSelect({ value, options = [], onChange, placeholder = 'Select...', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const selected = options.find(o => String(o.value) === String(value));
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className={`coord-place-select-wrap${isOpen ? ' coord-place-select-wrap--open' : ''}`} ref={ref}>
      <button type="button" onClick={() => setIsOpen(v => !v)} className={`coord-place-select-trigger${isOpen ? ' coord-place-select-trigger--open' : ''}`}>
        {Icon && <Icon className="coord-place-select-icon" />}
        <span className="coord-place-select-text">{selected ? selected.label : <span style={{color:'#94a3b8'}}>{placeholder}</span>}</span>
        <ChevronDown className={`coord-place-select-arrow${isOpen ? ' coord-place-select-arrow--rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="coord-place-select-dropdown">
          {options.map(opt => {
            const isSel = String(opt.value) === String(value);
            return (
              <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }} className={`coord-place-select-option${isSel ? ' coord-place-select-option--selected' : ''}`}>
                <span className="coord-place-select-option-label">{opt.label}</span>
                {isSel && <Check className="coord-place-select-check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorPlacement({ hideHeader }) {
  const [drives, setDrives] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDriveName, setNewDriveName] = useState("");
  const [newDriveDate, setNewDriveDate] = useState("2026-10-15");
  const [newBatch, setNewBatch] = useState("2026-COMP");
  const [creating, setCreating] = useState(false);

  const fetchDrives = async () => {
    try {
      const res = await api.get("/api/v1/drives");
      let list = res.data?.data;
      if (!Array.isArray(list) || list.length === 0) {
        list = [
          { id: 1, name: "TCS Digital Mock Placement Drive 2026", company: "TCS Digital", role: "Digital Software Engineer", driveDate: "2026-09-15", registeredCount: 45, cutoffScore: "80%", status: "Active Today" },
          { id: 2, name: "Infosys SP & DSE Mock Hiring Drive", company: "Infosys", role: "Specialist Programmer", driveDate: "2026-09-20", registeredCount: 52, cutoffScore: "75%", status: "Upcoming" }
        ];
      }
      const shared = getSharedDrives([]);
      const existingIds = new Set(list.map((d) => String(d.id)));
      const sharedItems = shared
        .filter((s) => !existingIds.has(String(s.id)))
        .map((s) => ({
          id: s.id,
          name: s.name,
          company: s.company || "Industry Partner",
          role: "Graduate Trainee Engineer",
          driveDate: s.date || "2026-10-15",
          registeredCount: 0,
          cutoffScore: s.cutoffScore || "75%",
          status: s.status || "Upcoming",
        }));
      setDrives([...sharedItems, ...list]);
    } catch (err) {
      const shared = getSharedDrives([]);
      const fallbackList = [
        { id: 1, name: "TCS Digital Mock Placement Drive 2026", company: "TCS Digital", role: "Digital Software Engineer", driveDate: "2026-09-15", registeredCount: 45, cutoffScore: "80%", status: "Active Today" },
        { id: 2, name: "Infosys SP & DSE Mock Hiring Drive", company: "Infosys", role: "Specialist Programmer", driveDate: "2026-09-20", registeredCount: 52, cutoffScore: "75%", status: "Upcoming" }
      ];
      if (shared.length > 0) {
        const sharedItems = shared.map((s) => ({
          id: s.id,
          name: s.name,
          company: s.company || "Industry Partner",
          role: "Graduate Trainee Engineer",
          driveDate: s.date || "2026-10-15",
          registeredCount: 0,
          cutoffScore: "75%",
          status: "Upcoming",
        }));
        setDrives([...sharedItems, ...fallbackList]);
      } else {
        setDrives(fallbackList);
      }
    }
  };

  useEffect(() => {
    fetchDrives();
    const handleUpdate = () => fetchDrives();
    window.addEventListener(EVENTS.DRIVE_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.DRIVE_UPDATED, handleUpdate);
  }, []);

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!newDriveName.trim()) return;
    setCreating(true);

    addSharedDrive({
      name: newDriveName,
      date: newDriveDate,
      batch: newBatch,
      company: "Industry Partner",
    });

    try {
      await api.post("/api/v1/drives/create", {
        name: newDriveName,
        date: newDriveDate,
        eligible_batches: [newBatch],
      });
      setShowCreateModal(false);
      setNewDriveName("");
      fetchDrives();
    } catch (err) {
      console.error("Create drive failed:", err);
      fetchDrives();
      setShowCreateModal(false);
      setNewDriveName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      {!hideHeader && (
        <div className="coord-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="coord-page-title">Placement Readiness & Authorized Mock Drives</h1>
            <p className="coord-page-sub">
              Manage authorized placement drives, batch eligibility, and multi-round evaluation criteria.
            </p>
          </div>
          <button className="coord-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Mock Drive
          </button>
        </div>
      )}

      <div className="coord-stats-grid">
        <div className="coord-stat-card">
          <div className="coord-stat-label">Placement Eligible Students</div>
          <div className="coord-stat-value coord-stat-val--emerald">142 Students</div>
          <div className="coord-stat-subtext">Eligibility Threshold: 75% Score</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Active & Managed Drives</div>
          <div className="coord-stat-value coord-stat-val--indigo">{drives.length} Drives</div>
          <div className="coord-stat-subtext">3-Round Evaluation Enabled</div>
        </div>

        <div className="coord-stat-card">
          <div className="coord-stat-label">Dept Readiness Index</div>
          <div className="coord-stat-value coord-stat-val--amber">86.4%</div>
          <div className="coord-stat-subtext">Weightage: 30% Apt | 40% Cod | 30% AI</div>
        </div>
      </div>

      <div className="coord-card">
        <div className="coord-card-title">
          <Briefcase size={18} color="#4f46e5" />
          Authorized Placement & Mock Recruitment Drives
        </div>

        <div className="coord-drive-list">
          {drives.map((d) => (
            <div key={d.id} className="coord-drive-card">
              <div className="coord-drive-header">
                <div>
                  <div className="coord-drive-company">{d.name || d.company}</div>
                  <div className="coord-drive-role">{d.role || 'Software Development Engineer'}</div>
                </div>
                <span className={(d.status || '').includes("Active") ? "coord-drive-status--active" : "coord-drive-status--placed"}>
                  {d.status || 'Active'}
                </span>
              </div>

              <div className="coord-drive-meta">
                <span>Drive Date: <strong>{d.date || d.driveDate || '2026-09-25'}</strong></span>
                <span>Eligible: <strong>{Array.isArray(d.eligible_batches) ? d.eligible_batches.join(', ') : '2026-COMP, 2026-IT'}</strong></span>
                <span>Evaluation Rules: <strong>Aptitude (30%) + Coding (40%) + AI Interview (30%)</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>Create Authorized Placement Drive</h3>
            <form onSubmit={handleCreateDrive} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Drive Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accenture Placement Drive 2026"
                  value={newDriveName}
                  onChange={(e) => setNewDriveName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Drive Date</label>
                <input
                  type="date"
                  required
                  value={newDriveDate}
                  onChange={(e) => setNewDriveDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Eligible Batch</label>
                <CoordPlaceSelect
                  value={newBatch}
                  options={[
                    { value: "2026-COMP", label: "2026-COMP" },
                    { value: "2026-IT", label: "2026-IT" },
                    { value: "2026-ECS", label: "2026-ECS" },
                    { value: "All Batches", label: "All Batches" },
                  ]}
                  onChange={(val) => setNewBatch(val)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}>
                  {creating ? 'Creating...' : 'Create Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
