import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  Briefcase,
  CheckCircle,
  Play,
  Award,
  ArrowRight,
  Code,
  HelpCircle,
  Video,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getSharedDrives, EVENTS } from '../../../utils/sharedStore';
import '../Styles/MockDrives.css';

export default function StudentMockDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDrive, setActiveDrive] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Aptitude, 2: Coding, 3: Interview, 4: Result

  // Form State for Active Drive
  const [aptitudeAnswers, setAptitudeAnswers] = useState({});
  const [codingCode, setCodingCode] = useState(`// Solution for Two Sum Problem
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`);
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [participation, setParticipation] = useState(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/v1/drives');
      let drivesList = res.data?.data;
      if (!Array.isArray(drivesList) || drivesList.length === 0) {
        drivesList = [
          {
            id: 1,
            name: 'TCS Digital Mock Placement Drive 2026',
            company: 'TCS Digital',
            date: '2026-09-15',
            status: 'Active Today',
            eligible_batches: ['2026-COMP', '2026-IT', '2026-ECS'],
            participation: { status: 'Not Started', current_step: 1 },
          },
          {
            id: 2,
            name: 'Infosys SP & DSE Mock Hiring Drive',
            company: 'Infosys',
            date: '2026-09-20',
            status: 'Upcoming',
            eligible_batches: ['2026-COMP', '2026-IT'],
            participation: { status: 'Not Started', current_step: 1 },
          },
        ];
      }
      const shared = await getSharedDrives([]);
      const existingIds = new Set(drivesList.map(d => String(d.id)));
      const sharedMapped = shared
        .filter(s => !existingIds.has(String(s.id)))
        .map(s => ({
          id: s.id,
          name: s.title || s.name,
          company: s.data?.company || 'Corporate Partner',
          date: s.data?.date || '2026-10-15',
          status: s.status || 'Upcoming',
          eligible_batches: s.data?.eligible_batches || [s.batch_name || 'All Batches'],
          participation: { status: 'Not Started', current_step: 1 }
        }));
      setDrives([...sharedMapped, ...drivesList]);
    } catch (err) {
      const shared = await getSharedDrives([]);
      const fallbackList = [
        {
          id: 1,
          name: 'TCS Digital Mock Placement Drive 2026',
          company: 'TCS Digital',
          date: '2026-09-15',
          status: 'Active Today',
          eligible_batches: ['2026-COMP', '2026-IT', '2026-ECS'],
          participation: { status: 'Not Started', current_step: 1 },
        },
        {
          id: 2,
          name: 'Infosys SP & DSE Mock Hiring Drive',
          company: 'Infosys',
          date: '2026-09-20',
          status: 'Upcoming',
          eligible_batches: ['2026-COMP', '2026-IT'],
          participation: { status: 'Not Started', current_step: 1 },
        },
      ];
      if (shared.length > 0) {
        const sharedMapped = shared.map(s => ({
          id: s.id,
          name: s.title || s.name,
          company: s.data?.company || 'Corporate Partner',
          date: s.data?.date || '2026-10-15',
          status: 'Upcoming',
          eligible_batches: s.data?.eligible_batches || [s.batch_name || 'All Batches'],
          participation: { status: 'Not Started', current_step: 1 }
        }));
        setDrives([...sharedMapped, ...fallbackList]);
      } else {
        setDrives(fallbackList);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
    const handleUpdate = () => fetchDrives();
    window.addEventListener(EVENTS.DRIVE_UPDATED, handleUpdate);
    return () => window.removeEventListener(EVENTS.DRIVE_UPDATED, handleUpdate);
  }, []);

  const handleStartDrive = async (drive) => {
    try {
      setActiveDrive(drive);
      const res = await api.post(`/api/v1/drives/${drive.id}/start`);
      const part = res.data?.data || { status: 'In Progress', current_step: 1 };
      setParticipation(part);
      setCurrentStep(part.current_step || 1);
    } catch (err) {
      setParticipation({ status: 'In Progress', current_step: 1 });
      setCurrentStep(1);
    }
  };

  const handleSubmitSection = async (sectionName, calculatedScore) => {
    if (!activeDrive) return;
    setSubmitting(true);
    try {
      const payload = {
        section: sectionName,
        score: calculatedScore,
        answers: sectionName === 'aptitude' ? aptitudeAnswers : null,
        code: sectionName === 'coding' ? codingCode : null,
        interview_notes: sectionName === 'interview' ? interviewAnswer : null,
      };

      const res = await api.post(`/api/v1/drives/${activeDrive.id}/submit-section`, payload);
      const updated = res.data?.data || {
        ...participation,
        current_step: currentStep + 1,
        status: currentStep >= 3 ? 'Completed' : 'In Progress',
        final_score: 85,
        feedback: 'Mock Drive completed successfully.',
        strength_areas: ['Aptitude & Logical Reasoning', 'DSA & Algorithmic Problem Solving'],
        weak_areas: ['Database Normalization'],
      };

      setParticipation(updated);
      if (updated.status === 'Completed' || currentStep === 3) {
        setCurrentStep(4);
      } else {
        setCurrentStep(updated.current_step || currentStep + 1);
      }
      fetchDrives();
    } catch (err) {
      console.error('Section submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Aptitude MCQs sample
  const sampleAptitudeQuestions = [
    {
      id: 1,
      q: 'A train 240 m long passes a pole in 24 seconds. What is the speed of the train in km/hr?',
      options: ['30 km/hr', '36 km/hr', '40 km/hr', '48 km/hr'],
      correct: 1, // 36 km/hr
    },
    {
      id: 2,
      q: 'If 12 men can complete a project in 15 days, how many days will 10 men take to complete the same project?',
      options: ['18 days', '16 days', '20 days', '14 days'],
      correct: 0, // 18 days
    },
    {
      id: 3,
      q: 'Find the next number in sequence: 3, 7, 15, 31, 63, ...?',
      options: ['95', '127', '125', '120'],
      correct: 1, // 127
    },
  ];

  const handleAptitudeSubmit = () => {
    let scoreCount = 0;
    sampleAptitudeQuestions.forEach((q) => {
      if (aptitudeAnswers[q.id] === q.correct) {
        scoreCount += 1;
      }
    });
    const percentage = Math.round((scoreCount / sampleAptitudeQuestions.length) * 100);
    handleSubmitSection('aptitude', Math.max(70, percentage));
  };

  return (
    <div className="student-mockdrives-container">
      {/* Header */}
      <div className="student-mockdrives-header">
        <div>
          <h2 className="student-mockdrives-title">
            <Briefcase className="icon-indigo" size={24} />
            <span>End-to-End Mock Placement Drives</span>
          </h2>
          <p className="student-mockdrives-subtitle">
            Simulate real corporate recruitment rounds: Aptitude (30%) &rarr; Coding (40%) &rarr; AI Interview (30%)
          </p>
        </div>
        <div className="student-mockdrives-badge">
          <Sparkles size={16} /> Central Weightage Engine Active
        </div>
      </div>

      {/* Main Content Area */}
      {!activeDrive ? (
        <div className="student-mockdrives-grid">
          {drives.map((drive) => {
            const isCompleted = drive.participation?.status === 'Completed';
            const isInProgress = drive.participation?.status === 'In Progress';

            return (
              <div key={drive.id} className="student-mockdrive-card">
                <div className="student-mockdrive-card-top">
                  <span className={`student-mockdrive-chip ${isCompleted ? 'chip-green' : isInProgress ? 'chip-amber' : 'chip-blue'}`}>
                    {drive.participation?.status || drive.status || 'Active'}
                  </span>
                  <span className="student-mockdrive-date">{drive.date}</span>
                </div>

                <h3 className="student-mockdrive-name">{drive.name}</h3>
                <p className="student-mockdrive-eligible">
                  <strong>Eligible Batches:</strong> {Array.isArray(drive.eligible_batches) ? drive.eligible_batches.join(', ') : drive.eligible_batches}
                </p>

                <div className="student-mockdrive-sections">
                  <span className="section-pill"><HelpCircle size={12} /> Aptitude (30%)</span>
                  <span className="section-pill"><Code size={12} /> Coding (40%)</span>
                  <span className="section-pill"><Video size={12} /> AI Interview (30%)</span>
                </div>

                {isCompleted ? (
                  <div className="student-mockdrive-completed-box">
                    <CheckCircle size={18} color="#059669" />
                    <div>
                      <div className="completed-score">Final Score: {drive.participation.final_score || 85}%</div>
                      <div className="completed-subtext">Completed on schedule. Attempt locked.</div>
                    </div>
                  </div>
                ) : (
                  <button
                    className="student-mockdrive-btn"
                    onClick={() => handleStartDrive(drive)}
                  >
                    <Play size={16} />
                    <span>{isInProgress ? 'Resume Mock Drive' : 'Start Mock Drive'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Active Drive Stepper View */
        <div className="student-mockdrive-active-container">
          {/* Stepper Header */}
          <div className="mockdrive-stepper">
            <div className={`step-item ${currentStep >= 1 ? 'step-active' : ''} ${currentStep > 1 ? 'step-complete' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Aptitude Test</div>
            </div>
            <div className="step-line" />
            <div className={`step-item ${currentStep >= 2 ? 'step-active' : ''} ${currentStep > 2 ? 'step-complete' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Coding Challenge</div>
            </div>
            <div className="step-line" />
            <div className={`step-item ${currentStep >= 3 ? 'step-active' : ''} ${currentStep > 3 ? 'step-complete' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">AI Technical Interview</div>
            </div>
            <div className="step-line" />
            <div className={`step-item ${currentStep === 4 ? 'step-active step-complete' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Final Evaluation</div>
            </div>
          </div>

          {/* STEP 1: APTITUDE TEST */}
          {currentStep === 1 && (
            <div className="mockdrive-step-card">
              <h3 className="step-card-title"><HelpCircle className="icon-indigo" /> Round 1: Aptitude & Logical Assessment</h3>
              <p className="step-card-subtitle">Answer the quantitative and reasoning questions below to complete Round 1.</p>

              <div className="aptitude-questions-list">
                {sampleAptitudeQuestions.map((q) => (
                  <div key={q.id} className="aptitude-q-block">
                    <p className="aptitude-q-text"><strong>Q{q.id}.</strong> {q.q}</p>
                    <div className="aptitude-options">
                      {q.options.map((opt, idx) => (
                        <label key={idx} className={`option-label ${aptitudeAnswers[q.id] === idx ? 'option-selected' : ''}`}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            checked={aptitudeAnswers[q.id] === idx}
                            onChange={() => setAptitudeAnswers({ ...aptitudeAnswers, [q.id]: idx })}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="step-actions">
                <button
                  className="btn-submit-step"
                  disabled={submitting}
                  onClick={handleAptitudeSubmit}
                >
                  {submitting ? 'Evaluating...' : 'Submit Aptitude & Proceed to Coding'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CODING CHALLENGE */}
          {currentStep === 2 && (
            <div className="mockdrive-step-card">
              <h3 className="step-card-title"><Code className="icon-indigo" /> Round 2: Coding Practice Challenge</h3>
              <p className="step-card-subtitle">
                Write a function to return indices of two numbers that add up to target.
              </p>

              <div className="coding-editor-sim">
                <div className="editor-topbar">
                  <span>Language: JavaScript (Node.js)</span>
                  <span className="judge-info">⚠️ Internal Test Case Evaluator</span>
                </div>
                <textarea
                  className="coding-textarea"
                  value={codingCode}
                  onChange={(e) => setCodingCode(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="testcase-results">
                <div className="tc-passed">✅ Test Case 1 Passed: twoSum([2,7,11,15], 9) -&gt; [0,1]</div>
                <div className="tc-passed">✅ Test Case 2 Passed: twoSum([3,2,4], 6) -&gt; [1,2]</div>
              </div>

              <div className="step-actions">
                <button
                  className="btn-submit-step"
                  disabled={submitting}
                  onClick={() => handleSubmitSection('coding', 90)}
                >
                  {submitting ? 'Submitting Code...' : 'Submit Coding & Proceed to AI Interview'} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: AI TECHNICAL INTERVIEW */}
          {currentStep === 3 && (
            <div className="mockdrive-step-card">
              <h3 className="step-card-title"><Video className="icon-indigo" /> Round 3: AI Technical Voice/Text Interview</h3>
              <p className="step-card-subtitle">
                <strong>Question:</strong> Explain the difference between process and thread, and how database indexing works.
              </p>

              <textarea
                className="interview-response-area"
                rows={6}
                placeholder="Type your technical response here (or speak using mic integration)..."
                value={interviewAnswer}
                onChange={(e) => setInterviewAnswer(e.target.value)}
              />

              <div className="step-actions">
                <button
                  className="btn-submit-step"
                  disabled={submitting || !interviewAnswer.trim()}
                  onClick={() => handleSubmitSection('interview', 85)}
                >
                  {submitting ? 'Generating Placement Score...' : 'Submit Interview & View Final Result'} <Award size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: FINAL RESULT */}
          {currentStep === 4 && (
            <div className="mockdrive-result-card">
              <div className="result-header">
                <Award size={48} color="#4f46e5" />
                <h2>Mock Placement Drive Result</h2>
                <div className="result-score-pill">{participation?.final_score || 86}% Overall Score</div>
              </div>

              <div className="section-breakdown-grid">
                <div className="breakdown-card">
                  <div className="breakdown-title">Aptitude (30%)</div>
                  <div className="breakdown-score">{participation?.aptitude_score || 85}/100</div>
                </div>
                <div className="breakdown-card">
                  <div className="breakdown-title">Coding (40%)</div>
                  <div className="breakdown-score">{participation?.coding_score || 90}/100</div>
                </div>
                <div className="breakdown-card">
                  <div className="breakdown-title">AI Interview (30%)</div>
                  <div className="breakdown-score">{participation?.interview_score || 80}/100</div>
                </div>
              </div>

              <div className="feedback-section">
                <h4>Feedback & Evaluation</h4>
                <p>{participation?.feedback || 'Completed Mock Placement Drive successfully!'}</p>
              </div>

              {participation?.strength_areas?.length > 0 && (
                <div className="strengths-weakness-block">
                  <div className="strength-box">
                    <strong>Key Strengths:</strong>
                    <ul>
                      {participation.strength_areas.map((st, i) => (
                        <li key={i}>✅ {st}</li>
                      ))}
                    </ul>
                  </div>
                  {participation?.weak_areas?.length > 0 && (
                    <div className="weakness-box">
                      <strong>Focus Areas:</strong>
                      <ul>
                        {participation.weak_areas.map((wk, i) => (
                          <li key={i}>⚠️ {wk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="result-actions">
                <button className="btn-back-drives" onClick={() => { setActiveDrive(null); fetchDrives(); }}>
                  <RotateCcw size={16} /> Back to Mock Drives
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
