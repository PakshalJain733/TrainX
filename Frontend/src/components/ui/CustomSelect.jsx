import React, { useState, useRef, useEffect } from "react";
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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Normalize options array
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        onClick={() => setIsOpen((prev) => !prev)}
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

      {isOpen && (
        <div className="custom-select-dropdown">
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
        </div>
      )}
    </div>
  );
}
