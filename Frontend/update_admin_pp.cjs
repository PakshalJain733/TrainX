const fs = require('fs');
const p = 'src/pages/Admin/Components/AD_PracticeProblems.jsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  'memoryLimit: "128 MB",\r\n    description: "",\r\n  });',
  'memoryLimit: "128 MB",\n    description: "",\n    dueDate: "",\n  });'
).replace(
  'memoryLimit: "128 MB",\n    description: "",\n  });',
  'memoryLimit: "128 MB",\n    description: "",\n    dueDate: "",\n  });'
);

c = c.replace(
  'description: newProb.description,\r\n      testCases: [],\r\n    };',
  'description: newProb.description,\n      due_date: newProb.dueDate,\n      testCases: [],\n    };'
).replace(
  'description: newProb.description,\n      testCases: [],\n    };',
  'description: newProb.description,\n      due_date: newProb.dueDate,\n      testCases: [],\n    };'
);

c = c.replace(
  'memoryLimit: "128 MB",\r\n      description: "",\r\n    });',
  'memoryLimit: "128 MB",\n      description: "",\n      dueDate: "",\n    });'
).replace(
  'memoryLimit: "128 MB",\n      description: "",\n    });',
  'memoryLimit: "128 MB",\n      description: "",\n      dueDate: "",\n    });'
);

c = c.replace(
  '<div className="form-group-admin">\r\n                    <label>XP Points</label>',
  '<div className="form-group-admin">\n                    <label>Due Date</label>\n                    <input type="date" value={newProb.dueDate} onChange={(e) => setNewProb({...newProb, dueDate: e.target.value})} className="form-input-admin" />\n                  </div>\n                  <div className="form-group-admin">\n                    <label>XP Points</label>'
).replace(
  '<div className="form-group-admin">\n                    <label>XP Points</label>',
  '<div className="form-group-admin">\n                    <label>Due Date</label>\n                    <input type="date" value={newProb.dueDate} onChange={(e) => setNewProb({...newProb, dueDate: e.target.value})} className="form-input-admin" />\n                  </div>\n                  <div className="form-group-admin">\n                    <label>XP Points</label>'
);

fs.writeFileSync(p, c);
console.log('done!');
