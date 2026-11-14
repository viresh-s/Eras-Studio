import React from "react";

export interface AdminIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Professional Admin Panel Icons
 * Style: Minimalist, clean 24x24 outline vector iconography
 * Inspired by Its Hover (micro-precision), Flaticon (minimal line), and Icons8 (system UI)
 * Consistent 1.75px default stroke, rounded joins, zero 3D/AI-generated fill clutter.
 */

// 1. Overview Dashboard (Clean monitor layout with split panels)
export function OverviewIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

// 2. Users / Patrons (Two clean minimalist silhouettes)
export function UsersIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// 3. Subscriptions (Premium membership card with contactless/chip accent)
export function SubscriptionsIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="9" y2="15" />
      <line x1="12" y1="15" x2="14" y2="15" />
    </svg>
  );
}

// 4. Creators (Studio artist palette & fine brush - replaces generic AI sparkles)
export function CreatorsIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M13.5 22a8.5 8.5 0 1 1 8.5-8.5c0 1.2-.5 2.1-1.4 2.6-.9.5-1.6 1.4-1.6 2.4a3.5 3.5 0 0 1-5.5 3.5" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <circle cx="9" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}

// 5. Collectors (Exclusive art vault / gallery gem acquisition)
export function CollectorsIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
      <path d="M2 9h20" />
      <path d="M10 21l-3-12 2-6" />
      <path d="M14 21l3-12-2-6" />
    </svg>
  );
}

// 6. Artworks (Editorial framed gallery canvas)
export function ArtworksIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
      <polyline points="14 14 17 17" />
    </svg>
  );
}

// 7. Reports / Moderation (Distinct flag on pole - avoids shield redundancy)
export function ReportsIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}

// 8. Career Operations & Representation - COR (Agency seal / laurel crest)
export function CorIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      <circle cx="12" cy="8" r="2.5" />
    </svg>
  );
}

// 9. Careers (Curatorial portfolio briefcase)
export function CareersIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <path d="M12 12v2" />
      <path d="M2 12h20" />
    </svg>
  );
}

// 10. Security Centre (Sentinel keyhole shield)
export function SecurityIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="1.5" />
      <path d="M12 11.5V15" />
    </svg>
  );
}

// 11. Studio Settings (Minimalist fine equalizer sliders)
export function SettingsIcon({
  size = 18,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

// 12. Requests / Inquiries (Handshake / inbound artist request)
export function RequestsIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l6.6-6.6a2 2 0 0 0 0-2.8l-1.6-1.6a2 2 0 0 0-2.8 0L14 10.6" />
      <path d="m13 7.1-2-2a2 2 0 0 0-2.8 0L6.6 6.7a2 2 0 0 0 0 2.8l2 2" />
      <path d="m2 14 6 6" />
      <path d="m20 4-6 6" />
    </svg>
  );
}

// 13. Members (Curated verified membership badge)
export function MembersIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// 14. Applications / Dossier (Document review file with check)
export function ApplicationsIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// 15. Opportunities (Curatorial open call / opportunity compass)
export function OpportunitiesIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

// 16. Action & Status: Verified Check (Smooth circle check)
export function VerifiedCheckIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// 17. Action & Status: Ban / Suspend (Precision circle-slash)
export function BanIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

// 18. Action & Status: Trash / Delete (Crisp wastebasket)
export function TrashIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

// 19. Action: Export Data (Clean tray-download arrow)
export function ExportIcon({
  size = 16,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// 20. Action: Sort / Bidirectional Reorder
export function SortIcon({
  size = 14,
  strokeWidth = 1.75,
  className = "",
  ...props
}: AdminIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

