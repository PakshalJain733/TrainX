import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./GlobalTooltipManager.css";

/**
 * GlobalTooltipManager
 * 
 * Intercepts all native `title` and `data-tooltip` attributes across the entire project
 * and replaces the default OS/browser black box tooltip with a sleek, modern floating tooltip.
 */
export default function GlobalTooltipManager() {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const currentTargetRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleMouseOver = (e) => {
      // Find closest element with title, data-tooltip, or data-app-tooltip
      const el = e.target?.closest?.("[title], [data-tooltip], [data-app-tooltip]");
      if (!el) return;

      // Extract tooltip text
      const rawTitle = el.getAttribute("title");
      const dataTooltip = el.getAttribute("data-tooltip") || el.getAttribute("data-app-tooltip");
      const text = (rawTitle || dataTooltip || "").trim();

      if (!text) return;

      // Suppress native browser tooltip by stashing title in data-app-tooltip and removing title attribute
      if (rawTitle) {
        el.setAttribute("data-app-tooltip", rawTitle);
        el.removeAttribute("title");
      }

      // If already hovering this exact element, don't restart timer
      if (currentTargetRef.current === el) return;
      currentTargetRef.current = el;

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!currentTargetRef.current || !document.body.contains(currentTargetRef.current)) {
          return;
        }

        const rect = currentTargetRef.current.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const preferredPos = currentTargetRef.current.getAttribute("data-tooltip-position");
        
        // Auto-detect optimal placement: default top, fallback bottom if cramped near top edge
        let position = preferredPos;
        if (!position) {
          if (rect.top >= 42) {
            position = "top";
          } else if (window.innerHeight - rect.bottom >= 42) {
            position = "bottom";
          } else if (window.innerWidth - rect.right >= 80) {
            position = "right";
          } else {
            position = "left";
          }
        }

        let top = 0;
        let left = 0;

        switch (position) {
          case "bottom":
            top = rect.bottom + 7;
            left = Math.max(20, Math.min(window.innerWidth - 20, rect.left + rect.width / 2));
            break;
          case "right":
            top = rect.top + rect.height / 2;
            left = rect.right + 7;
            break;
          case "left":
            top = rect.top + rect.height / 2;
            left = rect.left - 7;
            break;
          case "top":
          default:
            top = rect.top - 7;
            left = Math.max(20, Math.min(window.innerWidth - 20, rect.left + rect.width / 2));
            break;
        }

        setActiveTooltip({
          text,
          top,
          left,
          position,
        });
      }, 95);
    };

    const handleMouseOut = (e) => {
      const current = currentTargetRef.current;
      if (!current) return;

      // Ignore mouse movements within child elements of the same target
      if (e.relatedTarget && current.contains(e.relatedTarget)) {
        return;
      }

      clearTimeout(timerRef.current);
      currentTargetRef.current = null;
      setActiveTooltip(null);
    };

    const handleDismiss = () => {
      clearTimeout(timerRef.current);
      currentTargetRef.current = null;
      setActiveTooltip(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    // Attach passive capture listeners for instant detection across all nested components
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("pointerdown", handleDismiss, true);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("pointerdown", handleDismiss, true);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, []);

  if (!activeTooltip || !activeTooltip.text) return null;

  return createPortal(
    <div
      className={`global-floating-tooltip global-floating-tooltip--${activeTooltip.position}`}
      style={{
        top: `${activeTooltip.top}px`,
        left: `${activeTooltip.left}px`,
      }}
    >
      <div className="global-floating-tooltip__arrow" />
      <span>{activeTooltip.text}</span>
    </div>,
    document.body
  );
}

