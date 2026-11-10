import { toISODate } from "@/lib/format";
import {
  PaymentType,
  VoucherStatus,
  type AuditEntry,
  type TimelineEvent,
  type Voucher,
} from "@/lib/types";

let seq = 10001;

function event(
  type: TimelineEvent["type"],
  label: string,
  daysAgo: number,
  actor: string,
  note?: string
): TimelineEvent {
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  return {
    id: `evt-${type}-${label.replace(/\s+/g, "-").toLowerCase()}-${seq}`,
    type,
    label,
    actor,
    note,
    timestamp: timestamp.toISOString(),
  };
}

function audit(
  action: string,
  daysAgo: number,
  actor: string,
  note?: string
): AuditEntry {
  const timestamp = new Date();
  timestamp.setDate(timestamp.getDate() - daysAgo);
  return {
    id: `aud-${action}-${seq}`,
    action,
    actor,
    timestamp: timestamp.toISOString(),
    note,
  };
}

interface SeedInput {
  payeeName: string;
  address: string;
  description: string;
  amount: number;
  status: VoucherStatus;
  daysAgo: number;
  paymentType?: PaymentType;
}

function makeVoucher(input: SeedInput): Voucher {
  const number = `PV-${seq++}`;
  const date = new Date();
  date.setDate(date.getDate() - input.daysAgo);
  const createdBy = ["Thasha", "Ravi"][input.daysAgo % 2];
  const timeline: TimelineEvent[] = [event("created", "Voucher created", input.daysAgo, createdBy)];

  if (input.status !== VoucherStatus.DRAFT) {
    timeline.push(
      event("submitted", "Submitted for approval", Math.max(input.daysAgo - 1, 0), createdBy)
    );
  }
  if (
    input.status === VoucherStatus.APPROVED ||
    input.status === VoucherStatus.PAID
  ) {
    timeline.push(
      event("approved", "Approved", Math.max(input.daysAgo - 2, 0), "Anoop")
    );
  }
  if (input.status === VoucherStatus.PAID) {
    timeline.push(
      event("paid", "Payment completed", Math.max(input.daysAgo - 3, 0), "Bank")
    );
  }
  if (input.status === VoucherStatus.REJECTED) {
    timeline.push(
      event(
        "rejected",
        "Rejected",
        Math.max(input.daysAgo - 2, 0),
        "Anoop",
        "Invoice details do not match the PO."
      )
    );
  }

  const auditLog: AuditEntry[] = [
    audit("voucher:create", input.daysAgo, createdBy, "Voucher record created"),
  ];
  if (input.status !== VoucherStatus.DRAFT) {
    auditLog.push(
      audit("voucher:submit", Math.max(input.daysAgo - 1, 0), createdBy, "Submitted for approval")
    );
  }

  return {
    id: `voucher-${number}`,
    voucherNumber: number,
    date: toISODate(date),
    status: input.status,
    paymentType: input.paymentType ?? PaymentType.BANK_TRANSFER,
    payee: {
      name: input.payeeName,
      address: input.address,
      phone: `+91 98${String(10000000 + input.daysAgo * 1234).slice(0, 8)}`,
      bankAccount: `1100${3000000 + input.daysAgo * 137}`,
      bankName: [
        "State Bank of India",
        "HDFC Bank",
        "ICICI Bank",
        "Axis Bank",
      ][input.daysAgo % 4],
    },
    payment: {
      description: input.description,
      invoiceNumber: `INV-2026-${String(1040 + input.daysAgo * 7)}`,
      amount: input.amount,
      currency: "INR",
    },
    banking: {
      chequeNumber: "",
      bankNumber: "",
    },
    authorization: {
      preparedBy: createdBy,
      approvalToPay: "Anoop",
      receiverName: input.payeeName,
      signatures: {
        preparedBy: true,
        approver:
          input.status === VoucherStatus.APPROVED ||
          input.status === VoucherStatus.PAID,
        receiver: input.status === VoucherStatus.PAID,
      },
    },
    timeline,
    auditLog,
    createdBy,
    createdAt: date.toISOString(),
    updatedAt: new Date(date.getTime() + 86400000).toISOString(),
  };
}

export function seedVouchers(): Voucher[] {
  seq = 10001;
  return [
    makeVoucher({
      payeeName: "Sunil Traders",
      address: "14 MG Road, Bengaluru, Karnataka 560001",
      description: "Office stationery and printing supplies",
      amount: 48500,
      status: VoucherStatus.PAID,
      daysAgo: 22,
      paymentType: PaymentType.CHEQUE,
    }),
    makeVoucher({
      payeeName: "Apex Logistics Pvt. Ltd.",
      address: "Plot 7, Transport Nagar, Chennai, Tamil Nadu 600001",
      description: "Freight and courier services - monthly",
      amount: 132500,
      status: VoucherStatus.PAID,
      daysAgo: 20,
    }),
    makeVoucher({
      payeeName: "Vision Infotech Solutions",
      address: "22 Cyber Hub, Gurugram, Haryana 122002",
      description: "IT support retainership - April",
      amount: 240000,
      status: VoucherStatus.PAID,
      daysAgo: 18,
      paymentType: PaymentType.CHEQUE,
    }),
    makeVoucher({
      payeeName: "Krishna Electricals",
      address: "8 Main Road, Pune, Maharashtra 411001",
      description: "Office electrical maintenance",
      amount: 16800,
      status: VoucherStatus.APPROVED,
      daysAgo: 14,
      paymentType: PaymentType.CASH,
    }),
    makeVoucher({
      payeeName: "Meridian Marketing Agency",
      address: "Tower B, Andheri East, Mumbai, Maharashtra 400069",
      description: "Brand campaign - Q2 creative fees",
      amount: 385000,
      status: VoucherStatus.APPROVED,
      daysAgo: 12,
    }),
    makeVoucher({
      payeeName: "Blue Ridge Insurance Brokers",
      address: "5th Floor, Cyber City, Bengaluru, Karnataka 560100",
      description: "Reinsurance premium settlement",
      amount: 620000,
      status: VoucherStatus.PENDING_APPROVAL,
      daysAgo: 8,
      paymentType: PaymentType.CHEQUE,
    }),
    makeVoucher({
      payeeName: "Greenline Facilities Services",
      address: "91 Nehru Place, New Delhi 110019",
      description: "Office housekeeping services - March",
      amount: 96000,
      status: VoucherStatus.PENDING_APPROVAL,
      daysAgo: 6,
    }),
    makeVoucher({
      payeeName: "Horizon Travel & Tours",
      address: "Vashi Plaza, Navi Mumbai, Maharashtra 400703",
      description: "Client visit travel reimbursements",
      amount: 57400,
      status: VoucherStatus.PENDING_APPROVAL,
      daysAgo: 4,
    }),
    makeVoucher({
      payeeName: "Precision Accounting LLP",
      address: "12 Park Street, Kolkata, West Bengal 700016",
      description: "Statutory audit fees - FY 2025-26",
      amount: 175000,
      status: VoucherStatus.DRAFT,
      daysAgo: 2,
    }),
    makeVoucher({
      payeeName: "Shree Balaji Traders",
      address: "Amar Complex, Jaipur, Rajasthan 302001",
      description: "Purchase of office furniture",
      amount: 118000,
      status: VoucherStatus.REJECTED,
      daysAgo: 10,
      paymentType: PaymentType.CHEQUE,
    }),
    makeVoucher({
      payeeName: "Nova Insurance Broking Co.",
      address: "Marine Drive, Kochi, Kerala 682031",
      description: "Policy commission payout - March",
      amount: 91000,
      status: VoucherStatus.APPROVED,
      daysAgo: 16,
    }),
    makeVoucher({
      payeeName: "Sahyadri Security Services",
      address: "3 MG Road, Surat, Gujarat 395003",
      description: "Security services - quarterly",
      amount: 84000,
      status: VoucherStatus.PAID,
      daysAgo: 25,
      paymentType: PaymentType.CASH,
    }),
  ];
}

export function buildVoucherNumber(existing: Voucher[]): string {
  const max = existing.reduce((highest, voucher) => {
    const match = voucher.voucherNumber.match(/(\d+)\s*$/);
    if (!match) return highest;
    return Math.max(highest, Number(match[1]));
  }, 10000);
  return `PV-${max + 1}`;
}