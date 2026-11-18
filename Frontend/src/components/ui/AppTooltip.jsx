import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "./AppTooltip.css";

export default function AppTooltip({
  text,
  show = true,
  position = "right",
  isActive = false,
  delay = 80,
  children,
}) {
  const [coords, setCoords] = useState(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);

  const calculateCoords = (rect, pos) => {
    switch (pos) {
      case "left":
        return {
          top: rect.top + rect.height / 2,
          left: rect.left - 10,
        };
      case "top":
        return {
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        };
      case "bottom":
        return {
          top: rect.bottom + 8,
          left: rect.left + rect.width / 2,
        };
      case "right":
      default:
        return {
          top: rect.top + rect.height / 2,
          left: rect.right + 10,
        };
    }
  };

  const handleMouseEnter = (e) => {
    if (children?.props?.onMouseEnter) {
      children.props.onMouseEnter(e);
    }

    if (!show || !text) {
      setVisible(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const newCoords = calculateCoords(rect, position);

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCoords(newCoords);
      setVisible(true);
    }, delay);
  };

  const handleMouseLeave = (e) => {
    if (children?.props?.onMouseLeave) {
      children.props.onMouseLeave(e);
    }
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const handleClick = (e) => {
    if (children?.props?.onClick) {
      children.props.onClick(e);
    }
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  // Dismiss on any scroll or window resize
  useEffect(() => {
    if (!visible) return;

    const handleDismiss = () => {
      clearTimeout(timeoutRef.current);
      setVisible(false);
    };

    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);

    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
    };
  }, [visible]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!React.isValidElement(children)) {
    return children;
  }

  // Clone child without the native `title` attribute so the browser's default tooltip is suppressed
  const child = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    title: undefined, // Suppress default browser tooltip
  });

  return (
    <>
      {child}
      {visible && coords && show && Boolean(text) &&
        createPortal(
          <div
            className={`app-floating-tooltip app-floating-tooltip--${position}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            <div className="app-floating-tooltip__arrow" />
            <span className="app-floating-tooltip__text">{text}</span>
            {isActive && <span className="app-floating-tooltip__active-dot" />}
          </div>,
          document.body
        )}
    </>
  );
}

