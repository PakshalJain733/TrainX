import os

layouts = [
    'c:/Users/Administrator/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Student/Components/ST_Layout.jsx',
    'c:/Users/Administrator/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Coordinator/Components/CO_Layout.jsx',
    'c:/Users/Administrator/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Mentor/Components/MN_Layout.jsx',
    'c:/Users/Administrator/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/SuperAdmin/Components/SA_Layout.jsx',
    'c:/Users/Administrator/CAMPUS-TRAINING-PORTAL/Frontend/src/pages/Admin/Components/AD_Layout.jsx'
]

for file in layouts:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update the notif-list-card div to remove onClick and update style
    target1 = '''            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              onClick={() => {
                toggleSingleRead(n.id);
                setExpandedId(prev => prev === n.id ? null : n.id);
              }}
              style={{ cursor: "pointer", flexDirection: "column", gap: 0 }}
              title="Click to view details"
            >'''
    replacement1 = '''            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              style={{ cursor: "default", flexDirection: "column", gap: 0 }}
            >'''
    
    # 2. Update the notif-card-title div
    target2 = '''                    <div className="notif-card-title">{n.title}</div>
                    <div className="notif-card-time">{n.time}</div>'''
    replacement2 = '''                    <div 
                      className="notif-card-title"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSingleRead(n.id);
                        setExpandedId(n.id);
                      }}
                      style={{ cursor: "pointer", color: "#3b82f6", textDecoration: "underline", flex: 1 }}
                      title="Click to view full message"
                    >
                      {n.title}
                    </div>
                    <div className="notif-card-time">{n.time}</div>'''

    # 3. Remove inline desc
    target3 = '''              {expandedId === n.id && n.desc && (
                <div className="notif-card-desc expanded-desc" style={{ marginTop: '12px', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', width: '100%' }}>
                  {n.desc.replace('...', ' 4B regarding upcoming semester evaluations.')}
                </div>
              )}
            </div>
          ))'''
    replacement3 = '''            </div>
          ))'''

    # 4. Add modal at the end of NotificationDropdown
    target4 = '''      </div>
    </div>
  );
}'''
    replacement4 = '''      </div>

      {/* Modal for expanded message */}
      {expandedId && (
        <div 
          className="notif-modal-overlay" 
          onClick={() => setExpandedId(null)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div 
            className="notif-modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', position: 'relative' }}
          >
            {(() => {
               const n = notifications.find(notif => notif.id === expandedId);
               if (!n) return null;
               return (
                 <>
                   <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.25rem', marginBottom: '8px' }}>{n.title}</h3>
                   <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '16px' }}>{n.time}</span>
                   <p style={{ color: '#334155', lineHeight: '1.5', margin: 0, whiteSpace: 'pre-wrap' }}>
                     {n.desc ? n.desc.replace('...', ' 4B regarding upcoming semester evaluations.') : "No details available."}
                   </p>
                   <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                     <button 
                       onClick={() => setExpandedId(null)} 
                       style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                     >
                       Close
                     </button>
                   </div>
                 </>
               )
            })()}
          </div>
        </div>
      )}
    </div>
  );
}'''

    # For ST_Layout it was partially replaced by earlier edits, we can re-read or just replace remaining parts.
    # We will just attempt replace and print status.
    
    if 'ST_Layout' in file:
        content = content.replace(target4, replacement4)
    else:
        content = content.replace(target1, replacement1)
        content = content.replace(target2, replacement2)
        content = content.replace(target3, replacement3)
        content = content.replace(target4, replacement4)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
