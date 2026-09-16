import React from 'react';
import { mentorProfile } from '../../../data/mentorMockData';
import { User, Mail, Award, BookOpen, Star, ShieldCheck } from 'lucide-react';
import '../Styles/ProfilePage.css';

export default function ProfilePage() {
  return (
    <div className="mentor-profile-container">
      <div className="mentor-profile-card">
        <div className="mentor-profile-header">
          <div className="mentor-profile-avatar">
            VS
          </div>
          <div className="mentor-profile-info">
            <h2 className="mentor-profile-name">{mentorProfile.name}</h2>
            <p className="mentor-profile-role">{mentorProfile.role}</p>
            <p className="mentor-profile-dept">{mentorProfile.department}</p>
          </div>
        </div>

        <div className="mentor-profile-grid">
          <div className="mentor-profile-item">
            <span className="mentor-profile-label">Email Address</span>
            <p className="mentor-profile-value">{mentorProfile.email}</p>
          </div>
          <div className="mentor-profile-item">
            <span className="mentor-profile-label">Primary Specialization</span>
            <p className="mentor-profile-value">{mentorProfile.specialization}</p>
          </div>
          <div className="mentor-profile-item">
            <span className="mentor-profile-label">Teaching Experience</span>
            <p className="mentor-profile-value">{mentorProfile.experience}</p>
          </div>
          <div className="mentor-profile-item">
            <span className="mentor-profile-label">Student Rating</span>
            <p className="mentor-profile-rating">
              <Star className="mentor-rating-icon" /> {mentorProfile.rating} / 5.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

