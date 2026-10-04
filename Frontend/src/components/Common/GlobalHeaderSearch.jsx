import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, X, LayoutDashboard, Building2, Briefcase, Code2, Users, UserCog, 
  UserCheck, SlidersHorizontal, Activity, HelpCircle, User, CalendarCheck,
  BookOpenCheck, GraduationCap, Terminal, LineChart, Trophy, FileCheck2, 
  AlertTriangle, Megaphone, Sparkles, Bot, AlertCircle, Inbox, Flame
} from 'lucide-react';

const SEARCH_REGISTRY = [
  // ── SUPER ADMIN DASHBOARD ──
  { id: 'sa-overview', title: 'Overview', path: '/super-admin', role: 'superadmin', category: 'Dashboard', icon: LayoutDashboard, keywords: ['overview', 'dashboard', 'home', 'stats'] },
  { id: 'sa-colleges', title: 'Colleges', path: '/super-admin/colleges', role: 'superadmin', category: 'Institutions', icon: Building2, keywords: ['colleges', 'institutes', 'campuses', 'universities'] },
  { id: 'sa-batches', title: 'Batches', path: '/super-admin/batches', role: 'superadmin', category: 'Batches', icon: Code2, keywords: ['batches', 'classes', 'groups'] },
  { id: 'sa-users', title: 'Manage Users', path: '/super-admin/users', role: 'superadmin', category: 'User Management', icon: UserCog, keywords: ['users', 'manage users', 'students', 'mentors', 'coordinators', 'admins'] },
  { id: 'sa-maintenance', title: 'Feature Switches', path: '/super-admin/maintenance', role: 'superadmin', category: 'System', icon: SlidersHorizontal, keywords: ['feature switches', 'maintenance', 'emergency', 'switches'] },
  { id: 'sa-health', title: 'System Health', path: '/super-admin/health', role: 'superadmin', category: 'System', icon: Activity, keywords: ['system health', 'server', 'logs', 'status'] },
  { id: 'sa-tickets', title: 'Support Tickets', path: '/super-admin/tickets', role: 'superadmin', category: 'Support', icon: HelpCircle, keywords: ['support tickets', 'tickets', 'issues', 'help'] },
  { id: 'sa-profile', title: 'Super Admin Profile', path: '/super-admin/profile', role: 'superadmin', category: 'Account', icon: User, keywords: ['profile', 'account', 'settings'] },

  // ── ADMIN DASHBOARD ──
  { id: 'ad-overview', title: 'Overview', path: '/admin', role: 'admin', category: 'Dashboard', icon: LayoutDashboard, keywords: ['overview', 'dashboard', 'home'] },
  { id: 'ad-users', title: 'Manage Users', path: '/admin/users', role: 'admin', category: 'Users', icon: UserCog, keywords: ['users', 'manage users', 'students', 'mentors'] },
  { id: 'ad-approve', title: 'Approve Users', path: '/admin/approve-users', role: 'admin', category: 'Users', icon: UserCheck, keywords: ['approve users', 'pending', 'registrations'] },
  { id: 'ad-c2c', title: 'C2C Enrollments', path: '/admin/c2c', role: 'admin', category: 'Enrollments', icon: Briefcase, keywords: ['c2c enrollments', 'campus to corporate'] },
  { id: 'ad-batches', title: 'Batches', path: '/admin/batches', role: 'admin', category: 'Academic', icon: Code2, keywords: ['batches', 'classes'] },
  { id: 'ad-departments', title: 'Departments', path: '/admin/departments', role: 'admin', category: 'Academic', icon: Briefcase, keywords: ['departments', 'branches'] },
  { id: 'ad-learning', title: 'Manage Content', path: '/admin/learning', role: 'admin', category: 'Academic', icon: BookOpenCheck, keywords: ['manage content', 'courses', 'study material'] },
  { id: 'ad-practice', title: 'Coding Practice', path: '/admin/practice', role: 'admin', category: 'Assessments', icon: Terminal, keywords: ['coding practice', 'problems', 'challenges'] },
  { id: 'ad-quiz', title: 'Manage Quizzes', path: '/admin/quiz', role: 'admin', category: 'Assessments', icon: GraduationCap, keywords: ['manage quizzes', 'tests', 'exams'] },
  { id: 'ad-progress', title: 'Student Progress', path: '/admin/progress', role: 'admin', category: 'Analytics', icon: LineChart, keywords: ['student progress', 'analytics', 'performance'] },
  { id: 'ad-leaderboard', title: 'Leaderboard', path: '/admin/leaderboard', role: 'admin', category: 'Rankings', icon: Trophy, keywords: ['leaderboard', 'ranks', 'top students'] },
  { id: 'ad-attendance', title: 'Attendance', path: '/admin/attendance', role: 'admin', category: 'Academic', icon: CalendarCheck, keywords: ['attendance', 'records'] },
  { id: 'ad-weekly', title: 'Weekly Reports', path: '/admin/weekly-reports', role: 'admin', category: 'Reports', icon: FileCheck2, keywords: ['weekly reports', 'summaries'] },
  { id: 'ad-defaulters', title: 'Defaulters', path: '/admin/defaulters', role: 'admin', category: 'Records', icon: AlertTriangle, keywords: ['defaulters', 'absentees'] },
  { id: 'ad-broadcast', title: 'Broadcast Notice', path: '/admin/broadcast', role: 'admin', category: 'Communication', icon: Megaphone, keywords: ['broadcast notice', 'announcements', 'messages'] },
  { id: 'ad-help', title: 'Support Tickets', path: '/admin/help', role: 'admin', category: 'Support', icon: HelpCircle, keywords: ['support tickets', 'help', 'tickets'] },
  { id: 'ad-profile', title: 'Admin Profile', path: '/admin/profile', role: 'admin', category: 'Account', icon: User, keywords: ['profile', 'account', 'settings'] },

  // ── STUDENT DASHBOARD ──
  { id: 'st-overview', title: 'Overview', path: '/student', role: 'student', category: 'Dashboard', icon: LayoutDashboard, keywords: ['overview', 'dashboard', 'home'] },
  { id: 'st-batches', title: 'Batches', path: '/student/batches', role: 'student', category: 'Academic', icon: Code2, keywords: ['batches', 'classes'] },
  { id: 'st-learning', title: 'Learning Content', path: '/student/learning', role: 'student', category: 'Learning', icon: BookOpenCheck, keywords: ['learning content', 'courses', 'videos'] },
  { id: 'st-practice', title: 'Practice', path: '/student/practice', role: 'student', category: 'Practice', icon: Terminal, keywords: ['practice', 'coding', 'problems'] },
  { id: 'st-quiz', title: 'Quiz', path: '/student/quiz', role: 'student', category: 'Assessments', icon: GraduationCap, keywords: ['quiz', 'academic quiz', 'tests'] },
  { id: 'st-roadmap', title: 'AI Roadmap', path: '/student/roadmap', role: 'student', category: 'Learning', icon: Sparkles, keywords: ['ai roadmap', 'career path'] },
  { id: 'st-interview', title: 'AI Interview', path: '/student/ai-interview', role: 'student', category: 'Career', icon: Bot, keywords: ['ai interview', 'mock interview'] },
  { id: 'st-progress', title: 'Progress', path: '/student/progress', role: 'student', category: 'Analytics', icon: LineChart, keywords: ['progress', 'analytics', 'scores'] },
  { id: 'st-leaderboard', title: 'Leaderboard', path: '/student/leaderboard', role: 'student', category: 'Rankings', icon: Trophy, keywords: ['leaderboard', 'ranks', 'points'] },
  { id: 'st-attendance', title: 'Attendance', path: '/student/attendance', role: 'student', category: 'Records', icon: CalendarCheck, keywords: ['attendance', 'presence'] },
  { id: 'st-weekly', title: 'Weekly Reports', path: '/student/weekly-reports', role: 'student', category: 'Reports', icon: FileCheck2, keywords: ['weekly reports', 'status'] },
  { id: 'st-help', title: 'Support Tickets', path: '/student/help', role: 'student', category: 'Support', icon: HelpCircle, keywords: ['support tickets', 'help', 'desk'] },
  { id: 'st-profile', title: 'Student Profile', path: '/student/profile', role: 'student', category: 'Account', icon: User, keywords: ['profile', 'account', 'settings'] },

  // ── MENTOR / FACULTY DASHBOARD ──
  { id: 'mn-overview', title: 'Overview', path: '/mentor', role: 'faculty', category: 'Dashboard', icon: LayoutDashboard, keywords: ['overview', 'dashboard', 'home'] },
  { id: 'mn-students', title: 'Students', path: '/mentor/students', role: 'faculty', category: 'Students', icon: Users, keywords: ['students', 'mentees'] },
  { id: 'mn-batches', title: 'Batches', path: '/mentor/batches', role: 'faculty', category: 'Academic', icon: Code2, keywords: ['batches', 'classes'] },
  { id: 'mn-study', title: 'Study Material', path: '/mentor/study-material', role: 'faculty', category: 'Academic', icon: BookOpenCheck, keywords: ['study material', 'notes', 'lessons'] },
  { id: 'mn-quizzes', title: 'Quizzes', path: '/mentor/quizzes', role: 'faculty', category: 'Assessments', icon: GraduationCap, keywords: ['quizzes', 'assessments', 'exams'] },
  { id: 'mn-roadmaps', title: 'Roadmaps', path: '/mentor/roadmaps', role: 'faculty', category: 'Learning', icon: Sparkles, keywords: ['roadmaps', 'ai roadmaps'] },
  { id: 'mn-interviews', title: 'AI Interviews', path: '/mentor/ai-interviews', role: 'faculty', category: 'Career', icon: Bot, keywords: ['ai interviews', 'mock interviews'] },
  { id: 'mn-progress', title: 'Progress', path: '/mentor/performance', role: 'faculty', category: 'Analytics', icon: LineChart, keywords: ['progress', 'performance', 'analytics'] },
  { id: 'mn-skillgaps', title: 'Skill Gaps', path: '/mentor/skill-gaps', role: 'faculty', category: 'Analytics', icon: AlertTriangle, keywords: ['skill gaps', 'class weaknesses'] },
  { id: 'mn-leaderboard', title: 'Leaderboard', path: '/mentor/leaderboard', role: 'faculty', category: 'Rankings', icon: Trophy, keywords: ['leaderboard', 'rankings'] },
  { id: 'mn-attendance', title: 'Attendance', path: '/mentor/attendance', role: 'faculty', category: 'Academic', icon: CalendarCheck, keywords: ['attendance', 'mark attendance'] },
  { id: 'mn-weekly', title: 'Weekly Reports', path: '/mentor/weekly-reports', role: 'faculty', category: 'Reports', icon: FileCheck2, keywords: ['weekly reports', 'student summaries'] },
  { id: 'mn-defaulters', title: 'Defaulters', path: '/mentor/defaulters', role: 'faculty', category: 'Records', icon: AlertCircle, keywords: ['defaulters', 'at-risk students'] },
  { id: 'mn-mockdrives', title: 'Mock Drives', path: '/mentor/mock-drives', role: 'faculty', category: 'Career', icon: Briefcase, keywords: ['mock drives', 'placement prep'] },
  { id: 'mn-help', title: 'Support Ticket', path: '/mentor/help', role: 'faculty', category: 'Support', icon: HelpCircle, keywords: ['support ticket', 'help', 'queries'] },
  { id: 'mn-profile', title: 'Faculty Profile', path: '/mentor/profile', role: 'faculty', category: 'Account', icon: User, keywords: ['profile', 'account', 'settings'] },

  // ── COORDINATOR DASHBOARD ──
  { id: 'co-overview', title: 'Overview', path: '/coordinator', role: 'coordinator', category: 'Dashboard', icon: LayoutDashboard, keywords: ['overview', 'dashboard', 'home'] },
  { id: 'co-students', title: 'Students', path: '/coordinator/students', role: 'coordinator', category: 'Students', icon: Users, keywords: ['students', 'enrolled'] },
  { id: 'co-batches', title: 'Batches', path: '/coordinator/batches', role: 'coordinator', category: 'Academic', icon: Code2, keywords: ['batches', 'classes'] },
  { id: 'co-mentors', title: 'Mentors', path: '/coordinator/mentors', role: 'coordinator', category: 'Faculty', icon: UserCog, keywords: ['mentors', 'faculty', 'teachers'] },
  { id: 'co-performances', title: 'Performances', path: '/coordinator/performances', role: 'coordinator', category: 'Analytics', icon: LineChart, keywords: ['performances', 'analytics'] },
  { id: 'co-improvement', title: 'Academic Support', path: '/coordinator/improvement', role: 'coordinator', category: 'Support', icon: AlertTriangle, keywords: ['academic support', 'improvement'] },
  { id: 'co-leaderboard', title: 'Leaderboard', path: '/coordinator/leaderboard', role: 'coordinator', category: 'Rankings', icon: Trophy, keywords: ['leaderboard', 'rankings'] },
  { id: 'co-attendance', title: 'Attendance Governance', path: '/coordinator/attendance', role: 'coordinator', category: 'Records', icon: CalendarCheck, keywords: ['attendance governance', 'records'] },
  { id: 'co-requests', title: 'Requests & Approvals', path: '/coordinator/requests', role: 'coordinator', category: 'Management', icon: Inbox, keywords: ['requests', 'approvals', 'inbox'] },
  { id: 'co-broadcast', title: 'Broadcast Notice Center', path: '/coordinator/broadcast', role: 'coordinator', category: 'Communication', icon: Megaphone, keywords: ['broadcast notice center', 'announcements'] },
  { id: 'co-help', title: 'Support Ticket', path: '/coordinator/help', role: 'coordinator', category: 'Support', icon: HelpCircle, keywords: ['support ticket', 'help'] },
  { id: 'co-profile', title: 'Coordinator Profile', path: '/coordinator/profile', role: 'coordinator', category: 'Account', icon: User, keywords: ['profile', 'account', 'settings'] }
];

export default function GlobalHeaderSearch({ role }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const searchWrapRef = useRef(null);

  // Filter items matching current query & role
  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return SEARCH_REGISTRY.filter((item) => {
      // Role filter if specified
      if (role && item.role && item.role !== role) {
        if (role === 'mentor' && item.role === 'faculty') { /* allow */ }
        else if (role === 'faculty' && item.role === 'mentor') { /* allow */ }
        else return false;
      }

      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      return matchTitle || matchCategory || matchKeywords;
    }).slice(0, 8); // Top 8 matches
  }, [query, role]);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selection index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');
    if (item && item.path) {
      navigate(item.path);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="global-header-search-wrap" ref={searchWrapRef}>
      <div className={`global-header-search-bar ${isOpen ? 'global-header-search-bar--focused' : ''}`}>
        <Search size={16} className="global-header-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="global-header-search-input"
          placeholder="Search anything..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="global-header-search-clear"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="global-header-search-kbd">
            <kbd>Ctrl K</kbd>
          </span>
        )}
      </div>

      {/* Floating Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="global-header-search-dropdown">
          {results.length > 0 ? (
            <div className="global-header-search-list">
              <div className="global-header-search-header">
                Matching Results ({results.length})
              </div>
              {results.map((item, idx) => {
                const IconComp = item.icon || LayoutDashboard;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`global-header-search-item ${isSelected ? 'global-header-search-item--selected' : ''}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect(item);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="global-header-search-item-icon">
                      <IconComp size={16} />
                    </div>
                    <div className="global-header-search-item-info">
                      <span className="global-header-search-item-title">{item.title}</span>
                      <span className="global-header-search-item-cat">{item.category} &bull; {item.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="global-header-search-empty">
              No matching pages found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
