import React, { useState } from "react";

const AVATAR_COLORS = [
  { bg: "#dbeafe", text: "#1d4ed8" }, // Blue
  { bg: "#dcfce7", text: "#15803d" }, // Green
  { bg: "#fef3c7", text: "#b45309" }, // Amber
  { bg: "#ede9fe", text: "#6d28d9" }, // Purple
  { bg: "#fce7f3", text: "#be185d" }, // Pink
  { bg: "#e0f2fe", text: "#0369a1" }, // Sky
  { bg: "#ffedd5", text: "#c2410c" }, // Orange
  { bg: "#ccfbf1", text: "#0f766e" }, // Teal
];

function getColorForName(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 1).toUpperCase();
}

export default function UserAvatar({
  src,
  name = "User",
  size = 32,
  borderRadius = "50%",
  className = "",
  style = {},
}) {
  const [imgError, setImgError] = useState(false);

  const dimension = typeof size === "number" ? `${size}px` : size;
  const fontSize = typeof size === "number" ? `${Math.max(10, Math.floor(size * 0.4))}px` : "0.85rem";
  const colorScheme = getColorForName(name);

  // Clean and validate image URL
  const validSrc = src && typeof src === "string" && src.trim().length > 0 && !imgError ? src.trim() : null;

  return (
    <div
      className={`user-avatar-root ${className}`}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        borderRadius: borderRadius,
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backgroundColor: colorScheme.bg,
        color: colorScheme.text,
        fontWeight: "700",
        fontSize: fontSize,
        userSelect: "none",
        position: "relative",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.04)",
        ...style,
      }}
      title={name}
    >
      {validSrc ? (
        <img
          src={validSrc}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          loading="lazy"
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

