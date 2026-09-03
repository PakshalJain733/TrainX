import React, { useState } from "react";
import { Plus, Users, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import "../Styles/AdminBatches.css";

const initialBatches = [
  { id: 1, name: "Python Backend - Cohort A", students: 42, schedule: "Mon, Wed, Fri - 10:00 AM", mentor: "Dr. Vinay" },
  { id: 2, name: "React Frontend - Cohort C", students: 38, schedule: "Tue, Thu, Sat - 2:00 PM", mentor: "Prof. Anjali" },
  { id: 3, name: "Full Stack - Cohort B", students: 45, schedule: "Mon, Wed, Fri - 4:00 PM", mentor: "Mr. Suresh" },
  { id: 4, name: "Data Science - Cohort A", students: 30, schedule: "Tue, Thu - 10:00 AM", mentor: "Dr. Vinay" },
];

export default function AdminBatches() {
  const [batches, setBatches] = useState(initialBatches);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [students, setStudents] = useState("");
  const [schedule, setSchedule] = useState("");
  const [mentor, setMentor] = useState("");

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name || !schedule || !mentor) return;
    const newBatch = {
      id: Date.now(),
      name,
      students: parseInt(students) || 0,
      schedule,
      mentor
    };
    setBatches([...batches, newBatch]);
    setName("");
    setStudents("");
    setSchedule("");
    setMentor("");
    setShowAddForm(false);
  };

  return (
    <div className="admin-batches-container">
      <div className="batches-header-row">
        <div>
          <h2 className="batches-title">Manage Batches</h2>
          <p className="batches-subtitle">Create cohorts, assign mentors, and manage student enrollments.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="create-batch-btn">
          <Plus size={16} /> {showAddForm ? "Cancel" : "Create New Batch"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="add-batch-card">
          <CardHeader>
            <CardTitle>Create Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="add-batch-form">
              <div className="form-group">
                <label>Batch Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Node.js Backend - Cohort A" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Enrolled Students</label>
                  <input type="number" value={students} onChange={(e) => setStudents(e.target.value)} placeholder="e.g. 35" />
                </div>
                <div className="form-group">
                  <label>Weekly Schedule</label>
                  <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Mon, Wed - 11:00 AM" required />
                </div>
              </div>
              <div className="form-group">
                <label>Assigned Mentor</label>
                <input value={mentor} onChange={(e) => setMentor(e.target.value)} placeholder="e.g. Dr. Kulkarni" required />
              </div>
              <Button type="submit" className="submit-batch-btn">Create Batch</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="batches-grid">
        {batches.map((b) => (
          <Card key={b.id} className="batch-card">
            <CardHeader className="batch-card-header">
              <div className="batch-icon-container">
                <Users size={20} />
              </div>
              <div>
                <CardTitle className="batch-name">{b.name}</CardTitle>
                <p className="batch-mentor">Mentor: {b.mentor}</p>
              </div>
            </CardHeader>
            <CardContent className="batch-card-body">
              <div className="batch-meta-item">
                <Users size={16} />
                <span>{b.students} Enrolled Students</span>
              </div>
              <div className="batch-meta-item">
                <Calendar size={16} />
                <span>{b.schedule}</span>
              </div>
              <div className="batch-card-actions">
                <Button variant="outline" className="batch-view-btn">
                  View Students <ArrowRight size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
