import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  minWidth = "150px",
  style = {},
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : opt.name || String(opt.value),
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOpt = normalizedOptions.find((o) => String(o.value) === String(value));
  const displayLabel = selectedOpt ? selectedOpt.label : placeholder;

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${className}`}
      style={{
        position: "relative",
        display: "inline-block",
        minWidth: minWidth,
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.45rem 0.75rem",
          background: "#ffffff",
          border: isOpen ? "1px solid var(--primary)" : "1px solid var(--border)",
          borderRadius: "6px",
          color: selectedOpt ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: "0.82rem",
          fontWeight: "600",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: isOpen ? "0 0 0 2px var(--primary-light)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "left",
          }}
        >
          {displayLabel}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            color: "var(--text-secondary)",
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            width: "max-content",
            maxWidth: "320px",
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            maxHeight: "280px",
            overflowY: "auto",
            padding: "0.25rem 0",
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div style={{ padding: "0.6rem 0.8rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={String(opt.value)}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.45rem 0.8rem",
                    fontSize: "0.82rem",
                    fontWeight: isSelected ? "700" : "500",
                    color: isSelected ? "var(--primary)" : "var(--text-primary)",
                    background: isSelected ? "var(--primary-light)" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={14} style={{ color: "var(--primary)", flexShrink: 0, marginLeft: "0.5rem" }} />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

