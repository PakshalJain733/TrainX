import React, { useState } from "react";
import { 
  GraduationCap, 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  PlayCircle,
  AlertCircle,
  Timer,
  Trophy,
  Target
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import "../Styles/AcademicQuiz.css";

const quizzes = [
  {
    id: 1,
    title: "Mid-Term Evaluation: Data Structures",
    subject: "Computer Science",
    topic: "Arrays, Linked Lists, Trees",
    date: "August 28, 2026",
    duration: "45 mins",
    marks: "50 Marks",
    status: "Upcoming",
    difficulty: "Medium",
    questions: 25
  },
  {
    id: 2,
    title: "Operating Systems Core Concepts",
    subject: "Computer Science",
    topic: "Processes, Threads, Scheduling",
    date: "August 25, 2026",
    duration: "30 mins",
    marks: "30 Marks",
    status: "Completed",
    score: "26/30",
    difficulty: "Hard",
    questions: 15
  },
  {
    id: 3,
    title: "Database Normalization Quiz",
    subject: "Database Management",
    topic: "1NF, 2NF, 3NF, BCNF",
    date: "August 20, 2026",
    duration: "20 mins",
    marks: "20 Marks",
    status: "Completed",
    score: "18/20",
    difficulty: "Medium",
    questions: 10
  }
];

export default function AcademicQuiz() {
  const [activeTab, setActiveTab] = useState("All");
  
  const upcomingQuizzes = quizzes.filter(q => q.status === "Upcoming");
  const completedQuizzes = quizzes.filter(q => q.status === "Completed");
  
  const displayedQuizzes = activeTab === "All" 
    ? quizzes 
    : activeTab === "Upcoming" ? upcomingQuizzes : completedQuizzes;

  return (
    <div className="academic-quiz-page stack-6">
      <div className="quiz-hero-banner">
        <div className="quiz-hero-content">
          <div className="quiz-hero-icon">
            <GraduationCap size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="quiz-hero-title">Academic Quizzes</h1>
            <p className="quiz-hero-subtitle">Test your knowledge and track your academic progress</p>
          </div>
        </div>
        <div className="quiz-hero-stats">
          <div className="quiz-stat-box">
            <span className="quiz-stat-label">Avg. Score</span>
            <span className="quiz-stat-value text-emerald-600">88%</span>
          </div>
          <div className="quiz-stat-box">
            <span className="quiz-stat-label">Quizzes Taken</span>
            <span className="quiz-stat-value text-blue-600">12</span>
          </div>
        </div>
      </div>

      <div className="quiz-filters">
        <button 
          className={`quiz-filter-btn ${activeTab === "All" ? "active" : ""}`}
          onClick={() => setActiveTab("All")}
        >
          All Quizzes
        </button>
        <button 
          className={`quiz-filter-btn ${activeTab === "Upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("Upcoming")}
        >
          Upcoming <span className="quiz-filter-badge">{upcomingQuizzes.length}</span>
        </button>
        <button 
          className={`quiz-filter-btn ${activeTab === "Completed" ? "active" : ""}`}
          onClick={() => setActiveTab("Completed")}
        >
          Completed <span className="quiz-filter-badge">{completedQuizzes.length}</span>
        </button>
      </div>

      <div className="quiz-grid">
        {displayedQuizzes.map((quiz) => (
          <Card key={quiz.id} className={`quiz-card ${quiz.status === "Upcoming" ? "quiz-card-highlight" : ""}`}>
            <CardContent className="quiz-card-content">
              <div className="quiz-card-header">
                <Badge variant={quiz.status === "Upcoming" ? "primary" : "success"}>
                  {quiz.status}
                </Badge>
                {quiz.status === "Completed" && (
                  <div className="quiz-score-badge">
                    <Trophy size={14} className="text-yellow-500" />
                    <span>{quiz.score}</span>
                  </div>
                )}
              </div>
              
              <div className="quiz-main-info">
                <h3 className="quiz-title">{quiz.title}</h3>
                <p className="quiz-subject">{quiz.subject} • {quiz.topic}</p>
              </div>

              <div className="quiz-meta-grid">
                <div className="quiz-meta-item">
                  <CalendarDays size={14} className="quiz-meta-icon" />
                  <span>{quiz.date}</span>
                </div>
                <div className="quiz-meta-item">
                  <Timer size={14} className="quiz-meta-icon" />
                  <span>{quiz.duration}</span>
                </div>
                <div className="quiz-meta-item">
                  <Target size={14} className="quiz-meta-icon" />
                  <span>{quiz.marks}</span>
                </div>
                <div className="quiz-meta-item">
                  <AlertCircle size={14} className="quiz-meta-icon" />
                  <span>{quiz.questions} Qs</span>
                </div>
              </div>

              <div className="quiz-card-footer">
                {quiz.status === "Upcoming" ? (
                  <Button className="w-full quiz-start-btn">
                    <PlayCircle size={16} />
                    Start Quiz
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full quiz-review-btn">
                    <CheckCircle2 size={16} />
                    Review Answers
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
