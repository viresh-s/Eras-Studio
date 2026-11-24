"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  PlusSignIcon,
  Cancel01Icon,
  Tick01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Delete02Icon,
  AlertCircleIcon,
  Alert02Icon,
  Clock01Icon,
  Calendar01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Sorting01Icon,
  ArrowUpRight01Icon,
  SparklesIcon,
  SentIcon,
  ViewIcon,
  EyeOffIcon,
  StarIcon,
  Loading01Icon,
  Building01Icon,
  Briefcase01Icon,
  UserIcon,
  UserMultiple02Icon,
  UserCheck01Icon,
  UserBlock01Icon,
  Award01Icon,
  Tag01Icon,
  Copy01Icon,
  FilterIcon,
  Refresh01Icon,
  LockIcon,
  File01Icon,
  Download01Icon,
  Layers01Icon,
  Archive01Icon,
  Edit01Icon,
  Comment01Icon,
  HelpCircleIcon,
  InformationCircleIcon,
  MoreHorizontalIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  GraduationCapIcon,
  GlobeIcon,
  Location01Icon,
  PaintBoardIcon,
  Shield01Icon,
  Maximize01Icon,
  Grid02Icon,
  Menu01Icon,
  CheckmarkSquare01Icon,
  SquareIcon,
  Flag03Icon,
  Image01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

export interface HugeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

function createHugeIcon(icon: any, defaultSize = 16) {
  const Component = function ({
    size = defaultSize,
    strokeWidth = 2,
    className = "",
    color = "currentColor",
    ...props
  }: HugeIconProps) {
    return (
      <HugeiconsIcon
        icon={icon}
        size={Number(size)}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
        {...(props as any)}
      />
    );
  };
  Component.displayName = `HugeIcon(${icon?.name || "Icon"})`;
  return Component;
}

// Navigation & Actions
export const Search = createHugeIcon(Search01Icon);
export const Plus = createHugeIcon(PlusSignIcon);
export const X = createHugeIcon(Cancel01Icon);
export const Check = createHugeIcon(Tick01Icon);
export const CheckCircle2 = createHugeIcon(CheckmarkCircle01Icon);
export const CheckCircle = createHugeIcon(CheckmarkCircle01Icon);
export const XCircle = createHugeIcon(CancelCircleIcon);
export const Trash2 = createHugeIcon(Delete02Icon);
export const AlertCircle = createHugeIcon(AlertCircleIcon);
export const AlertTriangle = createHugeIcon(Alert02Icon);
export const Clock = createHugeIcon(Clock01Icon);
export const Calendar = createHugeIcon(Calendar01Icon);
export const ArrowRight = createHugeIcon(ArrowRight01Icon);
export const ArrowLeft = createHugeIcon(ArrowLeft01Icon);
export const ArrowUp = createHugeIcon(ArrowUp01Icon);
export const ArrowDown = createHugeIcon(ArrowDown01Icon);
export const ArrowUpDown = createHugeIcon(Sorting01Icon);
export const ChevronDown = createHugeIcon(ArrowDown01Icon);
export const ChevronUp = createHugeIcon(ArrowUp01Icon);
export const ExternalLink = createHugeIcon(ArrowUpRight01Icon);
export const ArrowUpRight = createHugeIcon(ArrowUpRight01Icon);
export const Sparkles = createHugeIcon(SparklesIcon);
export const Send = createHugeIcon(SentIcon);
export const Eye = createHugeIcon(ViewIcon);
export const EyeOff = createHugeIcon(EyeOffIcon);
export const Star = createHugeIcon(StarIcon);
export const Loader2 = createHugeIcon(Loading01Icon);
export const Building = createHugeIcon(Building01Icon);
export const Briefcase = createHugeIcon(Briefcase01Icon);
export const User = createHugeIcon(UserIcon);
export const Users = createHugeIcon(UserMultiple02Icon);
export const UserCheck = createHugeIcon(UserCheck01Icon);
export const UserX = createHugeIcon(UserBlock01Icon);
export const Ban = createHugeIcon(UserBlock01Icon);
export const Award = createHugeIcon(Award01Icon);
export const Tag = createHugeIcon(Tag01Icon);
export const Copy = createHugeIcon(Copy01Icon);
export const Filter = createHugeIcon(FilterIcon);
export const RefreshCw = createHugeIcon(Refresh01Icon);
export const Lock = createHugeIcon(LockIcon);
export const FileText = createHugeIcon(File01Icon);
export const FileDown = createHugeIcon(Download01Icon);
export const Layers = createHugeIcon(Layers01Icon);
export const Archive = createHugeIcon(Archive01Icon);
export const Edit3 = createHugeIcon(Edit01Icon);
export const MessageSquare = createHugeIcon(Comment01Icon);
export const MessageCircle = createHugeIcon(Comment01Icon);
export const HelpCircle = createHugeIcon(HelpCircleIcon);
export const Info = createHugeIcon(InformationCircleIcon);
export const MoreHorizontal = createHugeIcon(MoreHorizontalIcon);
export const PauseCircle = createHugeIcon(PauseCircleIcon);
export const PlayCircle = createHugeIcon(PlayCircleIcon);
export const GraduationCap = createHugeIcon(GraduationCapIcon);
export const Globe = createHugeIcon(GlobeIcon);
export const MapPin = createHugeIcon(Location01Icon);
export const Palette = createHugeIcon(PaintBoardIcon);
export const ShieldCheck = createHugeIcon(Shield01Icon);
export const Maximize2 = createHugeIcon(Maximize01Icon);
export const LayoutGrid = createHugeIcon(Grid02Icon);
export const List = createHugeIcon(Menu01Icon);
export const CheckSquare = createHugeIcon(CheckmarkSquare01Icon);
export const Square = createHugeIcon(SquareIcon);
export const MinusSquare = createHugeIcon(SquareIcon);
export const Flag = createHugeIcon(Flag03Icon);
export const Image = createHugeIcon(Image01Icon);
export const ImageIcon = createHugeIcon(Image01Icon);
export const Link = createHugeIcon(Link01Icon);
export const LinkIcon = createHugeIcon(Link01Icon);
