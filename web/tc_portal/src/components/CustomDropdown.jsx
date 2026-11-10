import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomDropdown({
  label,
  icon: Icon,
  value,
  options = [],
  onChange,
  disabled = false,
  placeholder = "Select an option",
  minWidth = "100%",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const normalizedOptions = options.map((opt) =>
    typeof opt === "object" ? opt : { value: opt, label: String(opt) }
  );

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  return (
    <div
      ref={dropdownRef}
      className={`custom-dropdown-container ${className}`}
      style={{ position: "relative", width: minWidth === "100%" ? "100%" : "auto", minWidth }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`custom-dropdown-trigger ${isOpen ? "dropdown-open" : ""} ${
          disabled ? "dropdown-disabled" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
          {Icon && <Icon size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
          {label && (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              {label}
            </span>
          )}
          <span className="dropdown-current-value">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2.4}
          className={`dropdown-chevron ${isOpen ? "chevron-rotated" : ""}`}
        />
      </button>

      {/* Floating Popover Menu (100% In-DOM — Never Native OS Menu) */}
      {isOpen && (
        <div className="custom-dropdown-menu" role="listbox">
          <div className="custom-dropdown-list">
            {normalizedOptions.length === 0 ? (
              <div style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                No options available
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`custom-dropdown-item ${isSelected ? "item-selected" : ""}`}
                  >
                    <span className="item-label">{opt.label}</span>
                    {isSelected && (
                      <Check size={14} strokeWidth={2.5} color="var(--accent-primary)" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
