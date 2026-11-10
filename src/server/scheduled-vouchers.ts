"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  type ScheduledVoucher,
  type ScheduledVoucherStatus,
  VoucherStatus,
} from "@/lib/types";
import {
  scheduledVoucherFormSchema,
  type ScheduledVoucherFormValues,
} from "@/lib/validation";
import { getServerAuth } from "@/server/auth-helpers";
import { createVoucherAction } from "@/server/vouchers";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "scheduled-vouchers.json");

// Initial mock scheduled vouchers for Chartered Brokers and Medibroker
const INITIAL_SCHEDULED_VOUCHERS: ScheduledVoucher[] = [
  {
    id: "sched-101",
    scheduledDate: getFutureDateString(2), // 2 days from now
    status: "scheduled",
    subsidiary: "chartered-brokers",
    paymentType: "bank-transfer",
    payee: {
      name: "CENTRAL ELECTRICITY BOARD",
      address: "Corporate Park, Ebene",
      phone: "+230 454 5000",
      bankAccount: "000012345678",
      bankName: "MCB",
    },
    payment: {
      description: "Monthly electricity bill for Head Office, Port Louis",
      invoiceNumber: "CEB-NOV-2026-092",
      amount: 48500,
      currency: "MUR",
    },
    banking: {
      chequeNumber: "",
      bankNumber: "MCB - 000112345678 (Current Account)",
    },
    authorization: {
      preparedBy: "Thasha",
      approvalToPay: "Anoop",
      receiverName: "Central Electricity Board",
    },
    initialStatus: "pending-approval",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdByName: "Thasha",
  },
  {
    id: "sched-102",
    scheduledDate: getFutureDateString(5), // 5 days from now
    status: "scheduled",
    subsidiary: "medibroker",
    paymentType: "bank-transfer",
    payee: {
      name: "MAURITIUS TELECOM",
      address: "Telecom Tower, Port Louis",
      phone: "+230 203 7000",
      bankAccount: "000087654321",
      bankName: "SBM",
    },
    payment: {
      description: "Dedicated Fibre Internet & Cloud Telephony subscription",
      invoiceNumber: "MT-INV-88321",
      amount: 22800,
      currency: "MUR",
    },
    banking: {
      chequeNumber: "",
      bankNumber: "SBM - 010223344556 (Operations Account)",
    },
    authorization: {
      preparedBy: "Ravi",
      approvalToPay: "Ashwina",
      receiverName: "Mauritius Telecom Ltd",
    },
    initialStatus: "pending-approval",
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    createdByName: "Ravi",
  },
  {
    id: "sched-103",
    scheduledDate: getFutureDateString(10), // 10 days from now
    status: "scheduled",
    subsidiary: "chartered-brokers",
    paymentType: "bank-transfer",
    payee: {
      name: "STATE INFORMATICS LIMITED",
      address: "SIL House, Cybercity, Ebene",
      phone: "+230 467 8000",
      bankAccount: "000099887766",
      bankName: "MCB",
    },
    payment: {
      description: "Enterprise IT maintenance & database backup support Q4",
      invoiceNumber: "SIL-Q4-4412",
      amount: 75000,
      currency: "MUR",
    },
    banking: {
      chequeNumber: "",
      bankNumber: "MCB - 000112345678 (Current Account)",
    },
    authorization: {
      preparedBy: "Thasha",
      approvalToPay: "Anoop",
      receiverName: "SIL Finance Dept",
    },
    initialStatus: "pending-approval",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByName: "Thasha",
  },
];

function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

function ensureStorage(): ScheduledVoucher[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SCHEDULED_VOUCHERS, null, 2), "utf-8");
      return INITIAL_SCHEDULED_VOUCHERS;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as ScheduledVoucher[];
  } catch (err) {
    console.error("Error reading scheduled vouchers store:", err);
    return INITIAL_SCHEDULED_VOUCHERS;
  }
}

function saveStorage(items: ScheduledVoucher[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving scheduled vouchers store:", err);
  }
}

// 1. Fetch all scheduled vouchers
export async function getScheduledVouchersAction(): Promise<ScheduledVoucher[]> {
  const items = ensureStorage();
  // Sort by scheduledDate ASC (soonest first)
  return items.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

// 2. Create a new scheduled voucher
export async function createScheduledVoucherAction(
  values: ScheduledVoucherFormValues
): Promise<{ success: boolean; scheduledVoucher?: ScheduledVoucher; error?: string }> {
  try {
    const { user } = await getServerAuth();
    const parsed = scheduledVoucherFormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const data = parsed.data;
    const items = ensureStorage();

    const newId = `sched-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newScheduled: ScheduledVoucher = {
      id: newId,
      scheduledDate: data.scheduledDate,
      status: "scheduled",
      subsidiary: data.subsidiary,
      paymentType: data.paymentType,
      payee: {
        name: data.payee.name,
        address: data.payee.address || "",
        phone: data.payee.phone || "",
        bankAccount: data.payee.bankAccount || "",
        bankName: data.payee.bankName || "",
      },
      payment: {
        description: data.payment.description,
        invoiceNumber: data.payment.invoiceNumber || "",
        amount: data.payment.amount,
        currency: data.payment.currency || "MUR",
      },
      banking: {
        chequeNumber: data.banking.chequeNumber || "",
        bankNumber: data.banking.bankNumber || "",
      },
      authorization: {
        preparedBy: data.authorization.preparedBy,
        approvalToPay: data.authorization.approvalToPay,
        receiverName: data.authorization.receiverName || data.payee.name,
      },
      initialStatus: data.initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdByName: user?.name || data.authorization.preparedBy || "Maker",
    };

    items.push(newScheduled);
    saveStorage(items);

    try {
      revalidatePath("/vouchers/scheduled");
    } catch {
      // Ignored outside Next.js action context
    }

    return { success: true, scheduledVoucher: newScheduled };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to schedule voucher." };
  }
}

// 3. Cancel scheduled voucher
export async function cancelScheduledVoucherAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const items = ensureStorage();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) {
      return { success: false, error: "Scheduled voucher not found." };
    }

    items[index].status = "cancelled";
    items[index].updatedAt = new Date().toISOString();
    saveStorage(items);

    try {
      revalidatePath("/vouchers/scheduled");
    } catch {
      // Ignored outside Next.js action context
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to cancel scheduled voucher." };
  }
}

// 4. Generate live voucher immediately from scheduled voucher
export async function generateVoucherFromScheduleAction(
  id: string
): Promise<{ success: boolean; voucherId?: string; voucherNumber?: string; error?: string }> {
  try {
    const items = ensureStorage();
    const item = items.find((i) => i.id === id);
    if (!item) {
      return { success: false, error: "Scheduled voucher not found." };
    }

    if (item.status === "generated") {
      return {
        success: false,
        error: `This voucher was already generated as ${item.generatedVoucherNumber}.`,
      };
    }

    if (item.status === "cancelled") {
      return { success: false, error: "Cannot generate a cancelled scheduled voucher." };
    }

    // Map scheduled details to standard VoucherFormValues
    const voucherPayload = {
      voucherInfo: {
        voucherNumber: "", // Will be assigned sequentially by database transaction
        subsidiary: item.subsidiary,
        date: item.scheduledDate || new Date().toISOString().slice(0, 10),
        paymentType: item.paymentType,
      },
      payee: {
        name: item.payee.name,
        address: item.payee.address,
        phone: item.payee.phone,
        bankAccount: item.payee.bankAccount,
        bankName: item.payee.bankName,
      },
      payment: {
        description: `[Scheduled for ${item.scheduledDate}] ${item.payment.description}`,
        invoiceNumber: item.payment.invoiceNumber,
        amount: item.payment.amount,
        currency: item.payment.currency,
      },
      banking: {
        chequeNumber: item.banking.chequeNumber,
        bankNumber: item.banking.bankNumber,
      },
      authorization: {
        preparedBy: item.authorization.preparedBy,
        approvalToPay: item.authorization.approvalToPay,
        receiverName: item.authorization.receiverName,
      },
    };

    const targetStatus =
      item.initialStatus === "pending-approval"
        ? VoucherStatus.PENDING_APPROVAL
        : VoucherStatus.DRAFT;

    const result = await createVoucherAction(
      voucherPayload,
      targetStatus,
      item.authorization.preparedBy
    );

    if (!result.success || !result.voucher) {
      return {
        success: false,
        error: result.error || "Failed to instantiate live voucher.",
      };
    }

    // Mark schedule as generated and link live voucher
    item.status = "generated";
    item.generatedVoucherId = result.voucher.id;
    item.generatedVoucherNumber = result.voucher.voucherNumber;
    item.generatedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    saveStorage(items);

    try {
      revalidatePath("/vouchers/scheduled");
      revalidatePath("/vouchers");
      revalidatePath(`/vouchers/${result.voucher.id}`);
    } catch {
      // Ignored outside Next.js action context
    }

    return {
      success: true,
      voucherId: result.voucher.id,
      voucherNumber: result.voucher.voucherNumber,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to generate live voucher from schedule.",
    };
  }
}
