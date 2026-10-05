import { useEffect } from "react";
import { apiFetch } from "../../utils/api";
import {
  handleIncomingNotificationForDesktop,
  isNotificationSupported,
  requestNotificationPermission,
} from "../../utils/browserNotification";

export default function DesktopNotificationListener() {
  useEffect(() => {
    if (!isNotificationSupported()) return;

    // Automatically prompt user for browser Notification permission if not yet decided ('default')
    if (Notification.permission === "default") {
      const userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (userRaw) {
        setTimeout(() => {
          requestNotificationPermission();
        }, 1500);
      }
    }

    // Listen to in-app custom broadcast events
    const handleNewBroadcast = (event) => {
      if (event && event.detail) {
        handleIncomingNotificationForDesktop(event.detail);
      }
    };

    window.addEventListener("new_broadcast_notification", handleNewBroadcast);

    // Periodic sync function to pull latest announcements for the active user role
    const syncRoleNotifications = async () => {
      const userRaw = sessionStorage.getItem("user") || localStorage.getItem("user");
      if (!userRaw) return;

      let role = "";
      try {
        const uObj = JSON.parse(userRaw);
        role = (uObj.role || "").toLowerCase();
      } catch (e) {}

      let endpoint = "";
      if (role.includes("student")) endpoint = "/student/notifications";
      else if (role.includes("mentor") || role.includes("faculty")) endpoint = "/mentor/notifications";
      else if (role.includes("coordinator")) endpoint = "/coordinator/notifications";
      else if (role.includes("admin")) endpoint = "/admin/broadcast";

      if (!endpoint) return;

      try {
        const res = await apiFetch(endpoint);
        if (res && res.data && Array.isArray(res.data)) {
          res.data.forEach((item) => {
            const formatted = {
              id: item.id || `notif-${item.created_at || Math.random()}`,
              title: item.title || "Announcement",
              desc: item.message || item.desc || item.description || "",
              time: item.time || (item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"),
            };
            handleIncomingNotificationForDesktop(formatted);
          });
        }
      } catch (err) {}
    };

    // Initial sync
    syncRoleNotifications();

    // Poll every 30 seconds for background desktop notifications
    const interval = setInterval(syncRoleNotifications, 30000);

    return () => {
      window.removeEventListener("new_broadcast_notification", handleNewBroadcast);
      clearInterval(interval);
    };
  }, []);

  return null;
}
