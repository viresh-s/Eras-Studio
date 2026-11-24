"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

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
        <span className="text-[#8A8A85] hover:text-[#100E90] transition-colors ml-0.5 inline-flex items-center">
          {copied ? (
            <HugeiconsIcon icon={Tick01Icon} size={12} className="text-emerald-600" strokeWidth={2.5} />
          ) : (
            <HugeiconsIcon icon={Copy01Icon} size={12} strokeWidth={2} />
          )}
        </span>
      )}
    </span>
  );
}
