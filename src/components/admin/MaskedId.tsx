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
 * Visually displays only the last character of an identifier,
 * while ensuring the full ID remains completely copyable (both via click and text selection).
 */
export function MaskedId({ id, className = "", showCopyIcon = false }: MaskedIdProps) {
  const [copied, setCopied] = useState(false);

  if (!id) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const strId = String(id);
  const lastChar = strId.slice(-1);
  const hiddenPrefix = strId.slice(0, -1);

  return (
    <span
      onClick={handleCopy}
      title={`Click to copy full ID: ${strId}`}
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity select-all ${className}`}
    >
      <span className="font-mono">
        <span
          style={{
            fontSize: 0,
            opacity: 0,
            width: 0,
            height: 0,
            display: "inline-block",
            overflow: "hidden",
            userSelect: "all",
          }}
          aria-hidden="true"
        >
          {hiddenPrefix}
        </span>
        <span>{lastChar}</span>
      </span>
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
