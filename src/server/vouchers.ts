"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  VoucherStatus as DbVoucherStatus,
  PaymentType as DbPaymentType,
  Prisma,
} from "@prisma/client";
import {
  VoucherStatus,
  PaymentType,
  type Voucher,
  type TimelineEvent,
  type AuditEntry,
} from "@/lib/types";
import { voucherFormSchema, type VoucherFormValues } from "@/lib/validation";
import { getServerAuth } from "@/server/auth-helpers";

// Helper: map DB record to Frontend Voucher format
function mapDbVoucherToFrontend(
  voucher: Prisma.VoucherGetPayload<{
    include: {
      timeline: true;
      auditEvents: true;
      createdBy: true;
    };
  }>
): Voucher {
  const statusMap: Record<DbVoucherStatus, VoucherStatus> = {
    [DbVoucherStatus.DRAFT]: VoucherStatus.DRAFT,
    [DbVoucherStatus.PENDING_APPROVAL]: VoucherStatus.PENDING_APPROVAL,
    [DbVoucherStatus.APPROVED]: VoucherStatus.APPROVED,
    [DbVoucherStatus.REJECTED]: VoucherStatus.REJECTED,
    [DbVoucherStatus.PAID]: VoucherStatus.PAID,
    [DbVoucherStatus.VOIDED]: VoucherStatus.DRAFT,
  };

  const paymentTypeMap: Record<DbPaymentType, PaymentType> = {
    [DbPaymentType.CASH]: PaymentType.CASH,
    [DbPaymentType.CHEQUE]: PaymentType.CHEQUE,
    [DbPaymentType.BANK_TRANSFER]: PaymentType.BANK_TRANSFER,
    [DbPaymentType.OTHER]: PaymentType.OTHER,
  };

  const timeline: TimelineEvent[] = voucher.timeline.map((t) => ({
    id: t.id,
    type: t.type as TimelineEvent["type"],
    label: t.label,
    actor: t.actor,
    note: t.note || undefined,
    timestamp: t.timestamp.toISOString(),
  }));

  const auditLog: AuditEntry[] = voucher.auditEvents.map((a) => ({
    id: a.id,
    action: a.action,
    actor: a.actorName,
    timestamp: a.timestamp.toISOString(),
    note: a.note || undefined,
  }));

  return {
    id: voucher.id,
    voucherNumber: voucher.voucherNumber,
    date: voucher.date.toISOString().slice(0, 10),
    status: statusMap[voucher.status],
    paymentType: paymentTypeMap[voucher.paymentType],
    payee: {
      name: voucher.payeeName,
      address: voucher.payeeAddress,
      phone: voucher.payeePhone,
      bankAccount: voucher.payeeBankAccount,
      bankName: voucher.payeeBankName,
    },
    payment: {
      description: voucher.description,
      invoiceNumber: voucher.invoiceNumber,
      amount: Number(voucher.amount),
      currency: voucher.currency,
    },
    banking: {
      chequeNumber: voucher.chequeNumber || "",
      bankNumber: voucher.bankNumber || "",
    },
    authorization: {
      preparedBy: voucher.preparedBy,
      approvalToPay: voucher.approvalToPay,
      receiverName: voucher.receiverName,
      signatures: {
        preparedBy: voucher.signedPrepared,
        approver: voucher.signedApprover,
        receiver: voucher.signedReceiver,
      },
    },
    timeline,
    auditLog,
    createdBy: voucher.createdBy?.name || voucher.preparedBy || "A. Fernandes",
    createdAt: voucher.createdAt.toISOString(),
    updatedAt: voucher.updatedAt.toISOString(),
  };
}

// Generate sequential PV Number using database transaction
export async function getNextVoucherNumber(): Promise<string> {
  const result = await db.$transaction(async (tx) => {
    const seq = await tx.voucherSequence.upsert({
      where: { id: "default" },
      update: { currentValue: { increment: 1 } },
      create: { id: "default", currentValue: 10013 },
    });
    return `PV-${seq.currentValue}`;
  }, { maxWait: 15000, timeout: 30000 });
  return result;
}

// Get all vouchers from Neon PostgreSQL
export async function getVouchersAction(): Promise<Voucher[]> {
  const { session } = await getServerAuth();
  
  const records = await db.voucher.findMany({
    where: session?.activeOrganizationId
      ? { tenantId: session.activeOrganizationId }
      : undefined,
    include: {
      timeline: {
        orderBy: { timestamp: "asc" },
      },
      auditEvents: {
        orderBy: { timestamp: "desc" },
      },
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return records.map(mapDbVoucherToFrontend);
}

// Get single voucher by ID
export async function getVoucherByIdAction(id: string): Promise<Voucher | null> {
  const record = await db.voucher.findUnique({
    where: { id },
    include: {
      timeline: {
        orderBy: { timestamp: "asc" },
      },
      auditEvents: {
        orderBy: { timestamp: "desc" },
      },
      createdBy: true,
    },
  });

  if (!record) return null;
  return mapDbVoucherToFrontend(record);
}

// Server action to create a new voucher (Draft or Submit)
export async function createVoucherAction(
  values: VoucherFormValues,
  status: VoucherStatus = VoucherStatus.DRAFT,
  customActor?: string
): Promise<{ success: boolean; voucher?: Voucher; error?: string }> {
  try {
    // 1. Resolve server session
    const { session, user } = await getServerAuth();
    const actor = user?.name || customActor || values.authorization?.preparedBy || "A. Fernandes";
    const actorId = user?.id || null;
    const tenantId = session?.activeOrganizationId || null;

    // 2. Server-side validation
    const parsed = voucherFormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed on server: " + parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { voucherInfo, payee, payment, banking, authorization } = parsed.data;

    // Concurrency-safe number check or generate
    let voucherNum = voucherInfo.voucherNumber;
    if (!voucherNum || voucherNum.trim() === "") {
      voucherNum = await getNextVoucherNumber();
    }

    const dbPaymentType: DbPaymentType =
      voucherInfo.paymentType === PaymentType.CHEQUE
        ? DbPaymentType.CHEQUE
        : voucherInfo.paymentType === PaymentType.CASH
        ? DbPaymentType.CASH
        : voucherInfo.paymentType === PaymentType.BANK_TRANSFER
        ? DbPaymentType.BANK_TRANSFER
        : DbPaymentType.OTHER;

    const dbStatus: DbVoucherStatus =
      status === VoucherStatus.PENDING_APPROVAL
        ? DbVoucherStatus.PENDING_APPROVAL
        : DbVoucherStatus.DRAFT;

    // 3. Atomic Database Transaction
    const created = await db.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          voucherNumber: voucherNum,
          date: new Date(voucherInfo.date),
          status: dbStatus,
          paymentType: dbPaymentType,
          payeeName: payee.name,
          payeeAddress: payee.address,
          payeePhone: payee.phone,
          payeeBankName: payee.bankName,
          payeeBankAccount: payee.bankAccount,
          description: payment.description,
          invoiceNumber: payment.invoiceNumber,
          amount: new Prisma.Decimal(payment.amount),
          currency: payment.currency,
          chequeNumber: banking.chequeNumber || null,
          bankNumber: banking.bankNumber || null,
          preparedBy: authorization.preparedBy || actor,
          approvalToPay: authorization.approvalToPay,
          receiverName: authorization.receiverName,
          signedPrepared: true,
          signedApprover: false,
          signedReceiver: false,
          createdById: actorId,
          tenantId: tenantId,
        },
        include: {
          timeline: true,
          auditEvents: true,
          createdBy: true,
        },
      });

      // Add timeline event
      await tx.voucherTimelineEvent.create({
        data: {
          voucherId: voucher.id,
          type: "created",
          label: dbStatus === DbVoucherStatus.DRAFT ? "Draft voucher created" : "Voucher created",
          actor,
        },
      });

      // Add audit event
      await tx.voucherAuditEvent.create({
        data: {
          voucherId: voucher.id,
          tenantId: tenantId,
          actorId: actorId,
          actorName: actor,
          action: "voucher:create",
          note: `Voucher ${voucherNum} created in Neon PostgreSQL`,
        },
      });

      if (dbStatus === DbVoucherStatus.PENDING_APPROVAL) {
        await tx.voucherTimelineEvent.create({
          data: {
            voucherId: voucher.id,
            type: "submitted",
            label: "Submitted for approval",
            actor,
          },
        });

        await tx.voucherAuditEvent.create({
          data: {
            voucherId: voucher.id,
            tenantId: tenantId,
            actorId: actorId,
            actorName: actor,
            action: "voucher:submit",
            note: "Submitted for approver review",
          },
        });
      }

      return tx.voucher.findUniqueOrThrow({
        where: { id: voucher.id },
        include: {
          timeline: true,
          auditEvents: true,
          createdBy: true,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    try {
      revalidatePath("/");
      revalidatePath("/vouchers");
      revalidatePath(`/vouchers/${created.id}`);
    } catch {
      // Safe outside Next.js request context
    }

    return { success: true, voucher: mapDbVoucherToFrontend(created) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create voucher";
    console.error("Error in createVoucherAction:", error);
    return { success: false, error: message };
  }
}

// Server action to update status (Approve, Reject, Mark-Paid, Void)
export async function updateVoucherStatusAction(
  id: string,
  newStatus: VoucherStatus,
  note?: string,
  customActor?: string
): Promise<{ success: boolean; voucher?: Voucher; error?: string }> {
  try {
    const { user } = await getServerAuth();
    const actor = user?.name || customActor || "S. Patel";
    const actorId = user?.id || null;
    const actorRole = (user?.role || "").toLowerCase();

    const target = await db.voucher.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (!target) {
      return { success: false, error: "Voucher record not found" };
    }

    // 1. Enforce Non-Negotiable Maker/Approver separation of duties
    if (newStatus === VoucherStatus.APPROVED) {
      const isCreatorById = actorId && target.createdById === actorId;
      const isCreatorByName =
        target.preparedBy.trim().toLowerCase() === actor.trim().toLowerCase();

      if (isCreatorById || isCreatorByName) {
        return {
          success: false,
          error:
            "Separation of duties violation: The Maker who prepared this voucher cannot approve it.",
        };
      }
    }

    // 2. Prevent mutation of already approved financial records
    if (target.status === DbVoucherStatus.PAID && newStatus !== VoucherStatus.PAID) {
      return {
        success: false,
        error: "Immutable record: Paid financial vouchers cannot be altered.",
      };
    }

    const dbNewStatus: DbVoucherStatus =
      newStatus === VoucherStatus.APPROVED
        ? DbVoucherStatus.APPROVED
        : newStatus === VoucherStatus.REJECTED
        ? DbVoucherStatus.REJECTED
        : newStatus === VoucherStatus.PAID
        ? DbVoucherStatus.PAID
        : DbVoucherStatus.DRAFT;

    const eventLabel =
      newStatus === VoucherStatus.APPROVED
        ? `Approved by ${actor}`
        : newStatus === VoucherStatus.REJECTED
        ? `Rejected: ${note || "Returned for correction"}`
        : newStatus === VoucherStatus.PAID
        ? "Payment disbursed and completed"
        : "Status updated";

    const auditAction =
      newStatus === VoucherStatus.APPROVED
        ? "voucher:approve"
        : newStatus === VoucherStatus.REJECTED
        ? "voucher:reject"
        : newStatus === VoucherStatus.PAID
        ? "voucher:paid"
        : "voucher:update";

    const updated = await db.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id },
        data: {
          status: dbNewStatus,
          signedApprover:
            newStatus === VoucherStatus.APPROVED ? true : target.signedApprover,
        },
      });

      await tx.voucherTimelineEvent.create({
        data: {
          voucherId: id,
          type: newStatus,
          label: eventLabel,
          actor,
          note: note || null,
        },
      });

      await tx.voucherAuditEvent.create({
        data: {
          voucherId: id,
          tenantId: target.tenantId,
          actorId: actorId,
          actorName: actor,
          action: auditAction,
          note: note || `${eventLabel} [Role: ${actorRole || "Approver"}]`,
        },
      });

      return tx.voucher.findUniqueOrThrow({
        where: { id },
        include: {
          timeline: { orderBy: { timestamp: "asc" } },
          auditEvents: { orderBy: { timestamp: "desc" } },
          createdBy: true,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    try {
      revalidatePath("/");
      revalidatePath("/vouchers");
      revalidatePath(`/vouchers/${id}`);
    } catch {
      // Safe outside Next.js request context
    }

    return { success: true, voucher: mapDbVoucherToFrontend(updated) };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update voucher status";
    console.error("Error in updateVoucherStatusAction:", error);
    return { success: false, error: message };
  }
}
