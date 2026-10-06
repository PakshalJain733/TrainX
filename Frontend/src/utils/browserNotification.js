import TrainXLogo from "../assets/TrainX.png";

/**
 * Check if the browser supports Desktop Notifications API.
 */
export const isNotificationSupported = () => {
  return typeof window !== "undefined" && "Notification" in window;
};

/**
 * Get current browser notification permission status: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
};

/**
 * Request desktop notification permission from the browser.
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      sendBrowserNotification("TrainX Desktop Notifications Activated! 🚀", {
        body: "You will now receive instant alerts on your laptop for all new announcements, broadcasts, and updates.",
        icon: TrainXLogo,
        tag: "permission-welcome",
      });
    }
    return permission;
  } catch (err) {
    console.warn("[BrowserNotification] Error requesting permission:", err);
    return Notification.permission;
  }
};

/**
 * Play a subtle audio chime when a desktop notification arrives.
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    // Ignore audio context errors if blocked by browser policy
  }
};

/**
 * Trigger a native laptop browser desktop notification.
 */
export const sendBrowserNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    const notificationOptions = {
      body: options.body || options.desc || options.message || "",
      icon: options.icon || TrainXLogo,
      badge: options.badge || TrainXLogo,
      tag: options.tag || `notif-${Date.now()}`,
      renotify: true,
      silent: false,
      ...options,
    };

    const notif = new Notification(title, notificationOptions);

    playNotificationChime();

    notif.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options.onClickUrl) {
        window.location.href = options.onClickUrl;
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn("[BrowserNotification] Failed to send desktop notification:", err);
    return null;
  }
};

/**
 * Storage key to keep track of desktop notification IDs already popped up
 */
const SEEN_NOTIFS_KEY = "trainx_seen_desktop_notif_ids";

export const getSeenNotifIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_NOTIFS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

export const markNotifAsSeen = (id) => {
  try {
    const seen = getSeenNotifIds();
    seen.add(String(id));
    const arr = Array.from(seen).slice(-200);
    localStorage.setItem(SEEN_NOTIFS_KEY, JSON.stringify(arr));
  } catch {}
};

/**
 * Handle incoming notification object and trigger browser desktop popup if not seen before
 */
export const handleIncomingNotificationForDesktop = (notifItem) => {
  if (!notifItem || !notifItem.title) return;
  const id = notifItem.id || `${notifItem.title}_${notifItem.time || Date.now()}`;
  const seenIds = getSeenNotifIds();

  if (!seenIds.has(String(id))) {
    markNotifAsSeen(id);
    sendBrowserNotification(notifItem.title, {
      body: notifItem.desc || notifItem.message || notifItem.description || "You have a new notice on TrainX Portal.",
      tag: String(id),
    });
    
    // Also trigger the in-app Broadcast Toast popup
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("new_broadcast_notification", { detail: notifItem }));
    }
  }
};
