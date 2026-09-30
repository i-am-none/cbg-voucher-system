import {
  FilePlus2,
  Files,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  segmentPrefix: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    segmentPrefix: "/",
  },
  {
    title: "Create Voucher",
    href: "/vouchers/new",
    icon: FilePlus2,
    segmentPrefix: "/vouchers/new",
  },
  {
    title: "Voucher History",
    href: "/vouchers",
    icon: Files,
    segmentPrefix: "/vouchers",
  },
];