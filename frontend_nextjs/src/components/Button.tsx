"use client";

import React from "react";

type Variant = "primary" | "secondary" | "danger";

export function Button({
  children,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  title,
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  const variantClass =
    variant === "primary"
      ? "retro-button"
      : variant === "secondary"
        ? "retro-button retro-button-secondary"
        : "retro-button";

  const dangerBorder =
    variant === "danger" ? "border-[rgba(251,113,133,0.55)] hover:border-[rgba(251,113,133,0.9)]" : "";

  return (
    <button
      type={type}
      className={`${variantClass} ${dangerBorder} ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}
