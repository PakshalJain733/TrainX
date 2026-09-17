import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute component: validates authentication and optional role restrictions.
 * If not authenticated, redirects to / (login).
 * If user does not have an allowed role, redirects to their designated home.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    let userRole = '';
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userRole = (user.role || '').toLowerCase();
    } catch {
      userRole = '';
    }

    const isAllowed = allowedRoles.some((role) => {
      const canonical = role.toLowerCase();
      if (canonical === 'super_admin' || canonical === 'superadmin') {
        return userRole.includes('super');
      }
      if (canonical === 'college_admin' || canonical === 'admin' || canonical === 'hod') {
        return userRole.includes('admin') || userRole.includes('hod');
      }
      if (canonical === 'coordinator') {
        return userRole.includes('coordinator');
      }
      if (canonical === 'mentor' || canonical === 'faculty') {
        return userRole.includes('mentor') || userRole.includes('faculty');
      }
      if (canonical === 'student') {
        return userRole === 'student' || userRole.includes('student');
      }
      return userRole === canonical;
    });

    if (!isAllowed) {
      // Direct user to their appropriate workspace
      if (userRole.includes('super')) return <Navigate to="/super-admin" replace />;
      if (userRole.includes('coordinator')) return <Navigate to="/coordinator" replace />;
      if (userRole.includes('mentor') || userRole.includes('faculty')) return <Navigate to="/mentor" replace />;
      if (userRole.includes('admin') || userRole.includes('hod')) return <Navigate to="/admin" replace />;
      return <Navigate to="/student" replace />;
    }
  }

  return children;
}
