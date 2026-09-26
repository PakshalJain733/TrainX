import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import "./CustomSelect.css";

export default function CustomSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select...",
  icon: Icon,
  className = "",
  disabled = false,
  direction = "auto", // 'auto' | 'up' | 'down'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const [openUpState, setOpenUpState] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options array
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const updatePosition = () => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const estimatedHeight = Math.min(220, Math.max(48, normalizedOptions.length * 36 + 12));
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let openUp = false;
    if (direction === "up") {
      openUp = true;
    } else if (direction === "down") {
      openUp = false;
    } else {
      // Auto direction: open upward if space below is tighter than estimated height AND top space is larger
      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        openUp = true;
      } else if (spaceBelow < 180 && spaceAbove > spaceBelow) {
        openUp = true;
      }
    }

    setOpenUpState(openUp);

    const availableSpace = openUp ? spaceAbove - 16 : spaceBelow - 16;
    const maxHeight = Math.max(80, Math.min(240, availableSpace));

    const computedLeft = Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8));

    const computedStyle = {
      position: "fixed",
      left: `${computedLeft}px`,
      width: `${rect.width}px`,
      maxHeight: `${maxHeight}px`,
      overflowY: "auto",
      zIndex: 2147483647,
    };

    if (openUp) {
      computedStyle.bottom = `${viewportHeight - rect.top + 6}px`;
      computedStyle.top = "auto";
    } else {
      computedStyle.top = `${rect.bottom + 6}px`;
      computedStyle.bottom = "auto";
    }

    setMenuStyle(computedStyle);
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, value, options]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`custom-select-wrap ${isOpen ? "custom-select-wrap--open" : ""} ${
        disabled ? "custom-select-wrap--disabled" : ""
      } ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="custom-select-trigger"
      >
        <div className="custom-select-left">
          {Icon && <Icon className="custom-select-icon" size={16} />}
          <span className="custom-select-label">
            {selectedOption ? (
              selectedOption.label
            ) : (
              <span className="custom-select-placeholder">{placeholder}</span>
            )}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`custom-select-arrow ${isOpen ? "custom-select-arrow--rotate" : ""}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={`custom-select-dropdown ${openUpState ? "custom-select-dropdown--up" : ""}`}
            style={menuStyle}
          >
            {normalizedOptions.length === 0 ? (
              <div className="custom-select-empty">No options available</div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const OptIcon = opt.icon;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`custom-select-option ${
                      isSelected ? "custom-select-option--selected" : ""
                    }`}
                  >
                    <div className="custom-select-option-left">
                      {OptIcon && <OptIcon size={15} className="custom-select-opt-icon" />}
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check size={15} className="custom-select-check" />}
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
