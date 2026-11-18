import { useEffect, useState } from "react";

/**
 * Manages mobile drawer scroll locking, Escape key dismissal, and user display metadata.
 */
export function useMobileDrawer(mobileOpen, onClose, fallbackRole = "User") {
  const [userInfo, setUserInfo] = useState({ name: fallbackRole, role: fallbackRole, initials: fallbackRole.slice(0, 2).toUpperCase() });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        const name = parsed?.full_name || parsed?.name || parsed?.username || parsed?.email || fallbackRole;
        const role = parsed?.role || fallbackRole;
        const parts = String(name).trim().split(/\s+/);
        const initials = parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : String(name).slice(0, 2).toUpperCase();
        setUserInfo({ name, role, initials });
      }
    } catch {
      // Ignore storage parse failure
    }
  }, [fallbackRole, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.classList.remove("mobile-drawer-open");
      return;
    }

    document.body.classList.add("mobile-drawer-open");

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("mobile-drawer-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onClose]);

  return userInfo;
}

