import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  CreditCardIcon,
  PaintBoardIcon,
  Folder01Icon,
  Image01Icon,
  Flag03Icon,
  Briefcase01Icon,
  JobSearchIcon,
  Shield01Icon,
  Settings01Icon,
  Mail01Icon,
  UserMultiple02Icon,
  File01Icon,
  StarIcon,
  Tick01Icon,
  UserBlock01Icon,
  Delete02Icon,
  Download01Icon,
  Sorting01Icon,
} from "@hugeicons/core-free-icons";

export interface AdminIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

// 1. Overview Dashboard
export function OverviewIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={DashboardSquare01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 2. Users / Patrons
export function UsersIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={UserGroupIcon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 3. Subscriptions
export function SubscriptionsIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={CreditCardIcon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 4. Creators
export function CreatorsIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={PaintBoardIcon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 5. Collectors
export function CollectorsIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Folder01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 6. Artworks
export function ArtworksIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Image01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 7. Reports / Moderation
export function ReportsIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Flag03Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 8. Career Operations & Representation - COR
export function CorIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Briefcase01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 9. Careers
export function CareersIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={JobSearchIcon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 10. Security Centre
export function SecurityIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Shield01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 11. Studio Settings
export function SettingsIcon({
  size = 18,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Settings01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 12. Requests / Inquiries
export function RequestsIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Mail01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 13. Members
export function MembersIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={UserMultiple02Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 14. Applications / Dossier
export function ApplicationsIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={File01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 15. Opportunities
export function OpportunitiesIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={StarIcon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 16. Action & Status: Verified Check
export function VerifiedCheckIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Tick01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 17. Action & Status: Ban / Suspend
export function BanIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={UserBlock01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 18. Action & Status: Trash / Delete
export function TrashIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Delete02Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 19. Action: Export Data
export function ExportIcon({
  size = 16,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Download01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}

// 20. Action: Sort / Bidirectional Reorder
export function SortIcon({
  size = 14,
  strokeWidth = 2,
  className = "",
  color = "currentColor",
  ...props
}: AdminIconProps) {
  return (
    <HugeiconsIcon
      icon={Sorting01Icon}
      size={Number(size)}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...(props as any)}
    />
  );
}
