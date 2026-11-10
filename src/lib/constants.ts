import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Send,
  type LucideIcon,
} from "lucide-react";

import {
  PaymentType,
  VoucherStatus,
  type VoucherStatus as VoucherStatusType,
} from "@/lib/types";

export interface StatusMeta {
  label: string;
  description: string;
  dotClassName: string;
  badgeVariant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  icon: LucideIcon;
}

export const STATUS_META: Record<VoucherStatusType, StatusMeta> = {
  [VoucherStatus.DRAFT]: {
    label: "Draft",
    description: "Saved but not yet submitted for approval",
    dotClassName: "bg-muted-foreground",
    badgeVariant: "secondary",
    icon: CircleDollarSign,
  },
  [VoucherStatus.PENDING_APPROVAL]: {
    label: "Pending Approval",
    description: "Submitted and waiting for approver sign-off",
    dotClassName: "bg-amber-500",
    badgeVariant: "outline",
    icon: Send,
  },
  [VoucherStatus.APPROVED]: {
    label: "Approved",
    description: "Approved and queued for payment",
    dotClassName: "bg-emerald-500",
    badgeVariant: "secondary",
    icon: CheckCircle2,
  },
  [VoucherStatus.REJECTED]: {
    label: "Rejected",
    description: "Rejected by the approver",
    dotClassName: "bg-destructive",
    badgeVariant: "destructive",
    icon: AlertCircle,
  },
  [VoucherStatus.PAID]: {
    label: "Paid",
    description: "Payment completed",
    dotClassName: "bg-primary",
    badgeVariant: "default",
    icon: Banknote,
  },
};

export const PAYMENT_TYPE_META: Record<
  PaymentType,
  { label: string; icon: LucideIcon }
> = {
  [PaymentType.CASH]: { label: "Cash", icon: Banknote },
  [PaymentType.CHEQUE]: { label: "Cheque", icon: CreditCard },
  [PaymentType.BANK_TRANSFER]: { label: "Bank Transfer", icon: Landmark },
  [PaymentType.OTHER]: { label: "Other", icon: Building2 },
};

export const PAYMENT_TYPE_OPTIONS = Object.values(PaymentType).map((value) => ({
  value,
  label: PAYMENT_TYPE_META[value].label,
}));

export const STATUS_OPTIONS = [
  { value: VoucherStatus.DRAFT, label: "Draft" },
  { value: VoucherStatus.PENDING_APPROVAL, label: "Pending Approval" },
  { value: VoucherStatus.APPROVED, label: "Approved" },
  { value: VoucherStatus.REJECTED, label: "Rejected" },
  { value: VoucherStatus.PAID, label: "Paid" },
];

export const CURRENCIES = ["INR", "MUR", "USD", "EUR", "GBP"] as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export const SHOWCASE_VALUES = {
  totalVouchers: 245,
  pendingApproval: 18,
  approvedPayments: 210,
  totalPaymentAmount: 2450000,
  defaultCurrency: "INR",
} as const;

export const MAKERS = ["Thasha", "Ravi"] as const;
export const APPROVERS = ["Anoop", "Ashwina"] as const;
export const ADMINS = ["Anoop"] as const;

export const DEMO_USER = {
  name: "Thasha",
  role: "Accountant (Maker)",
} as const;