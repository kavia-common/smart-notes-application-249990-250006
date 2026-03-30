"use client";

import React from "react";

export function TagPill({
  label,
  active,
  onClick,
  onRemove,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span
      className={`retro-pill text-sm ${active ? "border-[rgba(34,211,238,0.7)]" : ""}`}
    >
      <button
        type="button"
        className="text-left"
        onClick={onClick}
        title={onClick ? `Filter by tag ${label}` : undefined}
      >
        <span className="font-mono tracking-wide text-[13px]">{label}</span>
      </button>
      {onRemove ? (
        <button
          type="button"
          className="text-[12px] retro-muted hover:text-white"
          onClick={onRemove}
          aria-label={`Remove tag ${label}`}
          title={`Remove tag ${label}`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
