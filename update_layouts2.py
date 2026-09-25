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

    # We need to replace the modified card wrapper back to being clickable.
    target1 = '''            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              style={{ cursor: "default", flexDirection: "column", gap: 0 }}
            >'''
    replacement1 = '''            <div
              key={n.id}
              className={`notif-list-card ${n.unread ? "unread" : ""}`}
              onClick={() => {
                toggleSingleRead(n.id);
                setExpandedId(n.id);
              }}
              style={{ cursor: "pointer", flexDirection: "column", gap: 0 }}
              title="Click to view full message"
            >'''
    
    # We need to replace the title back to its original non-clickable state.
    target2 = '''                    <div 
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
                    </div>'''
    replacement2 = '''                    <div className="notif-card-title">{n.title}</div>'''

    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file}")
