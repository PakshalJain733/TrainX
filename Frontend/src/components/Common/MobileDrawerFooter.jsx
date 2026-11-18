import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";

/**
 * Shared responsive footer rendered inside mobile navigation drawers (<= 768px).
 * Displays user avatar, name, role, Profile link, and Logout button.
 */
export default function MobileDrawerFooter({ userInfo, profileUrl, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("role");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    } catch {
      // Ignore storage access failure
    }
    if (onClose) onClose();
    navigate("/");
  };

  return (
    <div className="mobile-drawer-footer">
      <div className="mobile-drawer-user-row">
        <div className="mobile-drawer-avatar" aria-hidden="true">
          {userInfo?.initials || "U"}
        </div>
        <div className="mobile-drawer-user-meta">
          <span className="mobile-drawer-user-name">{userInfo?.name || "Account"}</span>
          <span className="mobile-drawer-user-role">{userInfo?.role || "Member"}</span>
        </div>
      </div>
      <div className="mobile-drawer-actions">
        <Link
          to={profileUrl}
          className="mobile-drawer-action-btn"
          onClick={() => onClose && onClose()}
        >
          <User size={15} />
          <span>Profile</span>
        </Link>
        <button
          type="button"
          className="mobile-drawer-action-btn mobile-drawer-action-btn--danger"
          onClick={handleLogout}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

