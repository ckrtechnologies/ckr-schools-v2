import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Layers } from "lucide-react";

/**
 * SearchSelectDropdown
 * Premium custom dropdown matching Vision International School design language
 * (Floating card, in-menu search input, counter, avatars/initials, badge indicators, checkmarks)
 */
const SearchSelectDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  icon: TriggerIcon = Layers,
  minWidth = "175px",
  dropdownWidth = "320px",
  itemLabelSingular = "item",
  itemLabelPlural = "items",
  themeColor = "#1b8b3b",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value)) || null;
  }, [options, value]);

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label?.toLowerCase().includes(q);
      const matchSub = opt.subtext?.toLowerCase().includes(q);
      const matchBadge = opt.badge?.toLowerCase().includes(q);
      return matchLabel || matchSub || matchBadge;
    });
  }, [options, searchQuery]);

  // Click outside and ESC key listener
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

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    if (onChange) onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Helper to extract clean initials (e.g. "2 A" -> "2A", "SR KG A" -> "SR", "All Classes" -> "ALL")
  const getInitials = (opt) => {
    if (opt.initials) {
      const clean = String(opt.initials).trim();
      return clean.length > 3 ? clean.slice(0, 3).toUpperCase() : clean.toUpperCase();
    }
    if (String(opt.value) === "ALL") return "ALL";
    const parts = (opt.label || "").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  };

  const isFullWidth = minWidth === "100%";

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        display: isFullWidth ? "block" : "inline-block",
        width: isFullWidth ? "100%" : "auto",
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: isFullWidth ? "100%" : "auto",
          minWidth,
          height: "33px",
          backgroundColor: "#ffffff",
          border: isOpen ? `1.5px solid ${themeColor}` : "1px solid #cbd5e1",
          borderRadius: "7px",
          padding: "0 8px 0 9px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: isOpen
            ? `0 0 0 2px rgba(27, 139, 59, 0.18)`
            : "0 1px 2px rgba(0, 0, 0, 0.04)",
          transition: "all 0.15s ease",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minWidth: 0,
            flex: 1,
          }}
        >
          {TriggerIcon && <TriggerIcon size={13} color={themeColor} style={{ flexShrink: 0 }} />}
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: selectedOption ? "#1e293b" : "#94a3b8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          {selectedOption?.badge && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: "700",
                color: "#166534",
                backgroundColor: "#dcfce7",
                padding: "1px 5px",
                borderRadius: "4px",
              }}
            >
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            size={13}
            color="#64748b"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </div>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            width: dropdownWidth,
            maxWidth: "92vw",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            boxShadow:
              "0 12px 28px -4px rgba(0, 0, 0, 0.18), 0 6px 12px -4px rgba(0, 0, 0, 0.08)",
            zIndex: 99999,
            overflow: "hidden",
            animation: "fadeIn 0.12s ease",
          }}
        >
          {/* Search Box Header */}
          <div
            style={{
              padding: "8px 10px",
              backgroundColor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: "9px",
                  color: themeColor,
                  pointerEvents: "none",
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%",
                  height: "31px",
                  padding: "0 28px 0 28px",
                  fontSize: "12px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  border: `1.5px solid ${themeColor}`,
                  outline: "none",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 0 0 2px rgba(27, 139, 59, 0.1)",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    position: "absolute",
                    right: "7px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    padding: "2px",
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "5px",
                padding: "0 2px",
                fontSize: "10.5px",
              }}
            >
              <span style={{ fontWeight: "700", color: "#64748b" }}>
                {filteredOptions.length} of {options.length} {filteredOptions.length === 1 ? itemLabelSingular : itemLabelPlural}
              </span>
              {searchQuery && (
                <span style={{ color: "#166534", fontWeight: "600" }}>
                  Filter: "{searchQuery}"
                </span>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              padding: "4px",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "1.25rem 1rem",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  No match for "{searchQuery}"
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: themeColor,
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const initials = getInitials(opt);

                return (
                  <div
                    key={`opt_${opt.value}`}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#dcfce7" : "transparent",
                      borderLeft: isSelected ? `3px solid ${themeColor}` : "3px solid transparent",
                      transition: "background 0.12s ease",
                      marginBottom: "1px",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                      {/* Initials Avatar */}
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: isSelected ? themeColor : "#e2e8f0",
                          color: isSelected ? "#ffffff" : "#475569",
                          fontSize: initials.length > 2 ? "8px" : "10px",
                          fontWeight: "800",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          letterSpacing: "-0.02em",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "clip",
                          boxSizing: "border-box",
                          padding: "0 1px",
                        }}
                      >
                        {initials}
                      </div>

                      {/* Text content */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: isSelected ? "800" : "700",
                            color: isSelected ? "#14532d" : "#1e293b",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {opt.label}
                        </div>
                        {opt.subtext && (
                          <div
                            style={{
                              fontSize: "10.5px",
                              fontWeight: "500",
                              color: "#64748b",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {opt.subtext}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Tag & Selected Checkmark */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "6px" }}>
                      {opt.badge && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: isSelected ? "#166534" : "#64748b",
                            backgroundColor: isSelected ? "#bbf7d0" : "#f1f5f9",
                            padding: "1px 5px",
                            borderRadius: "4px",
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check size={14} color="#16a34a" strokeWidth={2.6} />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSelectDropdown;
