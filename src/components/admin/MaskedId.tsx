"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface MaskedIdProps {
  id?: string | null;
  className?: string;
  showCopyIcon?: boolean;
}

/**
 * MaskedId Component
 * Visually displays only the last 8 characters of an identifier,
 * and ensures only those last 8 characters are copiable (both via click and text selection).
 */
export function MaskedId({ id, className = "", showCopyIcon = false }: MaskedIdProps) {
  const [copied, setCopied] = useState(false);

  if (!id) return null;

  const strId = String(id);
  const displayId = strId.length > 8 ? strId.slice(-8) : strId;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      onClick={handleCopy}
      title={`Click to copy: ${displayId}`}
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity font-mono select-all ${className}`}
    >
      <span>{displayId}</span>
      {showCopyIcon && (
        <span className="text-[#8A8A85] hover:text-[#1345EE] transition-colors ml-0.5 inline-flex items-center">
          {copied ? (
            <Check size={12} className="text-emerald-600 stroke-[2.5]" />
          ) : (
            <Copy size={12} className="stroke-[2]" />
          )}
        </span>
      )}
    </span>
  );
}
