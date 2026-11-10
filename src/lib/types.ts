export const VoucherStatus = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending-approval",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const;

export type VoucherStatus =
  (typeof VoucherStatus)[keyof typeof VoucherStatus];

export const PaymentType = {
  CASH: "cash",
  CHEQUE: "cheque",
  BANK_TRANSFER: "bank-transfer",
  OTHER: "other",
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];

export const TimelineEventType = {
  CREATED: "created",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const;

export type TimelineEventType =
  (typeof TimelineEventType)[keyof typeof TimelineEventType];

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  label: string;
  actor?: string;
  note?: string;
  timestamp: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  note?: string;
}

export interface Voucher {
  id: string;
  voucherNumber: string;
  subsidiary?: string;
  date: string;
  status: VoucherStatus;
  paymentType: PaymentType;
  payee: {
    name: string;
    address: string;
    phone: string;
    bankAccount: string;
    bankName: string;
  };
  payment: {
    description: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
  };
  banking: {
    chequeNumber: string;
    bankNumber: string;
  };
  authorization: {
    preparedBy: string;
    approvalToPay: string;
    receiverName: string;
    signatures: {
      preparedBy: boolean;
      approver: boolean;
      receiver: boolean;
    };
  };
  timeline: TimelineEvent[];
  auditLog: AuditEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type VoucherAction =
  | "create"
  | "update"
  | "submit"
  | "approve"
  | "reject"
  | "mark-paid"
  | "export"
  | "delete";