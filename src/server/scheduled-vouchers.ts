"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  type ScheduledVoucher,
  type ScheduledVoucherStatus,
  PaymentType,
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

// Helper to calculate future date string YYYY-MM-DD
function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

// Initial mock records for dual subsidiaries
const INITIAL_SCHEDULED_VOUCHERS: ScheduledVoucher[] = [
  {
    id: "sched-101",
    scheduledDate: getFutureDateString(2),
    status: "scheduled",
    subsidiary: "chartered-brokers",
    paymentType: PaymentType.BANK_TRANSFER,
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
    scheduledDate: getFutureDateString(5),
    status: "scheduled",
    subsidiary: "medibroker",
    paymentType: PaymentType.BANK_TRANSFER,
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
    scheduledDate: getFutureDateString(10),
    status: "scheduled",
    subsidiary: "chartered-brokers",
    paymentType: PaymentType.BANK_TRANSFER,
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

// Helper: map Neon DB record to frontend ScheduledVoucher
function mapDbScheduledVoucherToFrontend(
  record: Prisma.ScheduledVoucherGetPayload<{}>
): ScheduledVoucher {
  const paymentTypeMap: Record<string, PaymentType> = {
    CASH: PaymentType.CASH,
    CHEQUE: PaymentType.CHEQUE,
    BANK_TRANSFER: PaymentType.BANK_TRANSFER,
    OTHER: PaymentType.OTHER,
  };

  const status: ScheduledVoucherStatus =
    record.status === "generated"
      ? "generated"
      : record.status === "cancelled"
      ? "cancelled"
      : "scheduled";

  const scheduledDate =
    record.scheduledDate instanceof Date
      ? record.scheduledDate.toISOString().slice(0, 10)
      : String(record.scheduledDate).slice(0, 10);

  return {
    id: record.id,
    scheduledDate,
    status,
    subsidiary: (record.subsidiary === "medibroker" ? "medibroker" : "chartered-brokers"),
    paymentType: paymentTypeMap[record.paymentType] || PaymentType.BANK_TRANSFER,
    payee: {
      name: record.payeeName,
      address: record.payeeAddress || "",
      phone: record.payeePhone || "",
      bankAccount: record.payeeBankAccount || "",
      bankName: record.payeeBankName || "",
    },
    payment: {
      description: record.description,
      invoiceNumber: record.invoiceNumber || "",
      amount: Number(record.amount),
      currency: record.currency || "MUR",
    },
    banking: {
      chequeNumber: record.chequeNumber || "",
      bankNumber: record.bankNumber || "",
    },
    authorization: {
      preparedBy: record.preparedBy,
      approvalToPay: record.approvalToPay,
      receiverName: record.receiverName || "",
    },
    initialStatus: (record.initialStatus === "draft" ? "draft" : "pending-approval"),
    generatedVoucherId: record.generatedVoucherId || undefined,
    generatedVoucherNumber: record.generatedVoucherNumber || undefined,
    generatedAt: record.generatedAt ? record.generatedAt.toISOString() : undefined,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    createdByName: record.createdByName || undefined,
  };
}

// Resilient file storage fallback helpers
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

// Seed initial records to Neon if table is completely empty
async function seedInitialScheduledVouchersToNeon(): Promise<void> {
  try {
    for (const v of INITIAL_SCHEDULED_VOUCHERS) {
      await db.scheduledVoucher.upsert({
        where: { id: v.id },
        update: {},
        create: {
          id: v.id,
          scheduledDate: new Date(v.scheduledDate),
          status: v.status,
          subsidiary: v.subsidiary,
          paymentType: "BANK_TRANSFER",
          payeeName: v.payee.name,
          payeeAddress: v.payee.address,
          payeePhone: v.payee.phone,
          payeeBankName: v.payee.bankName,
          payeeBankAccount: v.payee.bankAccount,
          description: v.payment.description,
          invoiceNumber: v.payment.invoiceNumber,
          amount: new Prisma.Decimal(v.payment.amount),
          currency: v.payment.currency,
          bankNumber: v.banking.bankNumber,
          chequeNumber: v.banking.chequeNumber,
          preparedBy: v.authorization.preparedBy,
          approvalToPay: v.authorization.approvalToPay,
          receiverName: v.authorization.receiverName,
          initialStatus: v.initialStatus,
          createdByName: v.createdByName,
        },
      });
    }
  } catch (seedErr) {
    console.warn("Could not seed initial scheduled vouchers to Neon:", seedErr);
  }
}

// 1. Fetch all scheduled vouchers directly from Neon PostgreSQL
export async function getScheduledVouchersAction(): Promise<ScheduledVoucher[]> {
  try {
    const records = await db.scheduledVoucher.findMany({
      orderBy: { scheduledDate: "asc" },
    });

    if (records.length > 0) {
      const mapped = records.map(mapDbScheduledVoucherToFrontend);
      saveStorage(mapped);
      return mapped;
    }

    // If Neon table has 0 rows, seed initial records
    await seedInitialScheduledVouchersToNeon();
    const seeded = await db.scheduledVoucher.findMany({
      orderBy: { scheduledDate: "asc" },
    });
    if (seeded.length > 0) {
      const mapped = seeded.map(mapDbScheduledVoucherToFrontend);
      saveStorage(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn("Neon DB query fallback to resilient cache:", err);
  }

  // Resilient fallback to local store if DB is temporarily unreachable
  const items = ensureStorage();
  return items.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

// 2. Create a new scheduled voucher in Neon PostgreSQL
export async function createScheduledVoucherAction(
  values: ScheduledVoucherFormValues
): Promise<{ success: boolean; scheduledVoucher?: ScheduledVoucher; error?: string }> {
  try {
    let user = null;
    try {
      const auth = await getServerAuth();
      user = auth.user;
    } catch {}

    const parsed = scheduledVoucherFormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const data = parsed.data;
    const dbPaymentType =
      data.paymentType === PaymentType.CHEQUE
        ? "CHEQUE"
        : data.paymentType === PaymentType.CASH
        ? "CASH"
        : data.paymentType === PaymentType.BANK_TRANSFER
        ? "BANK_TRANSFER"
        : "OTHER";

    const scheduledDateObj = new Date(data.scheduledDate);
    const amountDecimal = new Prisma.Decimal(data.payment.amount);

    let createdRecord: Prisma.ScheduledVoucherGetPayload<{}> | null = null;

    try {
      createdRecord = await db.scheduledVoucher.create({
        data: {
          scheduledDate: scheduledDateObj,
          status: "scheduled",
          subsidiary: data.subsidiary,
          paymentType: dbPaymentType,
          payeeName: data.payee.name,
          payeeAddress: data.payee.address || "",
          payeePhone: data.payee.phone || "",
          payeeBankName: data.payee.bankName || "",
          payeeBankAccount: data.payee.bankAccount || "",
          description: data.payment.description,
          invoiceNumber: data.payment.invoiceNumber || "",
          amount: amountDecimal,
          currency: data.payment.currency || "MUR",
          bankNumber: data.banking.bankNumber || "",
          chequeNumber: data.banking.chequeNumber || "",
          preparedBy: data.authorization.preparedBy,
          approvalToPay: data.authorization.approvalToPay,
          receiverName: data.authorization.receiverName || data.payee.name,
          initialStatus: data.initialStatus,
          createdById: user?.id || null,
          createdByName: user?.name || data.authorization.preparedBy || "Maker",
        },
      });
    } catch (neonErr) {
      console.warn("Neon create error, will store in resilient cache:", neonErr);
    }

    let resultItem: ScheduledVoucher;
    if (createdRecord) {
      resultItem = mapDbScheduledVoucherToFrontend(createdRecord);
    } else {
      const newId = `sched-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      resultItem = {
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
    }

    // Keep resilient cache in sync
    const items = ensureStorage();
    const existingIndex = items.findIndex((i) => i.id === resultItem.id);
    if (existingIndex >= 0) {
      items[existingIndex] = resultItem;
    } else {
      items.push(resultItem);
    }
    saveStorage(items);

    try {
      revalidatePath("/vouchers/scheduled");
      revalidatePath("/vouchers");
    } catch {}

    return { success: true, scheduledVoucher: resultItem };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to schedule voucher." };
  }
}

// 3. Cancel scheduled voucher in Neon PostgreSQL
export async function cancelScheduledVoucherAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();
    try {
      await db.scheduledVoucher.update({
        where: { id },
        data: { status: "cancelled", updatedAt: now },
      });
    } catch (neonErr) {
      console.warn("Neon cancel error, updating resilient cache:", neonErr);
    }

    const items = ensureStorage();
    const index = items.findIndex((i) => i.id === id);
    if (index >= 0) {
      items[index].status = "cancelled";
      items[index].updatedAt = now.toISOString();
      saveStorage(items);
    }

    try {
      revalidatePath("/vouchers/scheduled");
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to cancel scheduled voucher." };
  }
}

// 4. Generate live voucher immediately from scheduled voucher in Neon
export async function generateVoucherFromScheduleAction(
  id: string
): Promise<{ success: boolean; voucherId?: string; voucherNumber?: string; error?: string }> {
  try {
    let item: ScheduledVoucher | null = null;
    try {
      const dbRecord = await db.scheduledVoucher.findUnique({ where: { id } });
      if (dbRecord) {
        item = mapDbScheduledVoucherToFrontend(dbRecord);
      }
    } catch {}

    if (!item) {
      const items = ensureStorage();
      item = items.find((i) => i.id === id) || null;
    }

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
        voucherNumber: "", // Sequential PV number will be assigned by database transaction
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

    // Update Neon DB status
    const now = new Date();
    try {
      await db.scheduledVoucher.update({
        where: { id },
        data: {
          status: "generated",
          generatedVoucherId: result.voucher.id,
          generatedVoucherNumber: result.voucher.voucherNumber,
          generatedAt: now,
          updatedAt: now,
        },
      });
    } catch (neonErr) {
      console.warn("Neon update error after voucher generation:", neonErr);
    }

    // Keep resilient cache in sync
    const items = ensureStorage();
    const idx = items.findIndex((i) => i.id === id);
    if (idx >= 0) {
      items[idx].status = "generated";
      items[idx].generatedVoucherId = result.voucher.id;
      items[idx].generatedVoucherNumber = result.voucher.voucherNumber;
      items[idx].generatedAt = now.toISOString();
      items[idx].updatedAt = now.toISOString();
      saveStorage(items);
    }

    try {
      revalidatePath("/vouchers/scheduled");
      revalidatePath("/vouchers");
      revalidatePath(`/vouchers/${result.voucher.id}`);
    } catch {}

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
