import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, VoucherStatus, PaymentType } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Neon database with demo organization, users, and vouchers...");

  // 1. Create Organization (CBG)
  const org = await prisma.organization.upsert({
    where: { slug: "cbg-mauritius" },
    update: {},
    create: {
      name: "Chartered Brokers Group (CBG)",
      slug: "cbg-mauritius",
    },
  });

  // 2. Create Initial Sequence for Voucher Numbers
  await prisma.voucherSequence.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      currentValue: 10012,
    },
  });

  // 3. Create Demo Users
  const makerUser = await prisma.user.upsert({
    where: { email: "a.fernandes@charteredbrokers.com" },
    update: {},
    create: {
      name: "A. Fernandes",
      email: "a.fernandes@charteredbrokers.com",
      role: "maker",
      emailVerified: true,
    },
  });

  const approverUser = await prisma.user.upsert({
    where: { email: "s.patel@charteredbrokers.com" },
    update: {},
    create: {
      name: "S. Patel",
      email: "s.patel@charteredbrokers.com",
      role: "approver",
      emailVerified: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@charteredbrokers.com" },
    update: {},
    create: {
      name: "CBG Administrator",
      email: "admin@charteredbrokers.com",
      role: "admin",
      emailVerified: true,
    },
  });

  // Associate members to Organization
  await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: makerUser.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: makerUser.id,
      role: "maker",
    },
  });

  await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: approverUser.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: approverUser.id,
      role: "approver",
    },
  });

  await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: adminUser.id,
      role: "admin",
    },
  });

  // 4. Create Initial Seed Vouchers
  const sampleVouchers = [
    {
      voucherNumber: "PV-10001",
      date: new Date("2026-03-01"),
      status: VoucherStatus.PAID,
      paymentType: PaymentType.BANK_TRANSFER,
      payeeName: "Swan General Ltd",
      payeeAddress: "Swan Centre, 10 Intendance Street, Port Louis",
      payeePhone: "+230 207 3500",
      payeeBankName: "The Mauritius Commercial Bank Ltd (MCB)",
      payeeBankAccount: "000123456789",
      description: "Co-insurance settlement premium — Q1 2026 policy renewal",
      invoiceNumber: "INV-2026-0891",
      amount: 450000.0,
      currency: "INR",
      chequeNumber: null,
      bankNumber: "MCB-PL-01",
      preparedBy: "A. Fernandes",
      approvalToPay: "S. Patel",
      receiverName: "Swan General Ltd — Claims Dept",
      signedPrepared: true,
      signedApprover: true,
      signedReceiver: true,
      createdById: makerUser.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Voucher created", actor: "A. Fernandes", timestamp: new Date("2026-03-01T09:00:00Z") },
        { type: "submitted", label: "Submitted for approval", actor: "A. Fernandes", timestamp: new Date("2026-03-01T10:15:00Z") },
        { type: "approved", label: "Approved by Finance Director", actor: "S. Patel", timestamp: new Date("2026-03-02T14:30:00Z") },
        { type: "paid", label: "Payment completed via MCB Direct", actor: "S. Patel", timestamp: new Date("2026-03-03T11:00:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "A. Fernandes", note: "Voucher record created" },
        { action: "voucher:submit", actorName: "A. Fernandes", note: "Submitted for approval" },
        { action: "voucher:approve", actorName: "S. Patel", note: "Approved by S. Patel" },
        { action: "voucher:paid", actorName: "S. Patel", note: "Payment completed" },
      ],
    },
    {
      voucherNumber: "PV-10002",
      date: new Date("2026-03-05"),
      status: VoucherStatus.APPROVED,
      paymentType: PaymentType.CHEQUE,
      payeeName: "Mauritius Telecom",
      payeeAddress: "Telecom Tower, Edith Cavell Street, Port Louis",
      payeePhone: "+230 203 7000",
      payeeBankName: "State Bank of Mauritius (SBM)",
      payeeBankAccount: "000987654321",
      description: "Dedicated fiber link & VoIP infrastructure — March 2026",
      invoiceNumber: "MT-INV-44120",
      amount: 87500.0,
      currency: "INR",
      chequeNumber: "CHQ-882190",
      bankNumber: "SBM-CORP-04",
      preparedBy: "A. Fernandes",
      approvalToPay: "S. Patel",
      receiverName: "Mauritius Telecom Accounts",
      signedPrepared: true,
      signedApprover: true,
      signedReceiver: false,
      createdById: makerUser.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Voucher created", actor: "A. Fernandes", timestamp: new Date("2026-03-05T08:30:00Z") },
        { type: "submitted", label: "Submitted for approval", actor: "A. Fernandes", timestamp: new Date("2026-03-05T09:45:00Z") },
        { type: "approved", label: "Approved by Operations Lead", actor: "S. Patel", timestamp: new Date("2026-03-06T10:00:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "A. Fernandes", note: "Voucher record created" },
        { action: "voucher:submit", actorName: "A. Fernandes", note: "Submitted for approval" },
        { action: "voucher:approve", actorName: "S. Patel", note: "Approved by S. Patel" },
      ],
    },
    {
      voucherNumber: "PV-10003",
      date: new Date("2026-03-08"),
      status: VoucherStatus.PENDING_APPROVAL,
      paymentType: PaymentType.BANK_TRANSFER,
      payeeName: "SICOM General Insurance",
      payeeAddress: "SICOM Building, Sir Celicourt Antelme Street, Port Louis",
      payeePhone: "+230 203 8400",
      payeeBankName: "Absa Bank (Mauritius) Limited",
      payeeBankAccount: "000555666777",
      description: "Reinsurance treaty share allocation — Marine Cargo portfolio",
      invoiceNumber: "SIC-2026-0043",
      amount: 1250000.0,
      currency: "INR",
      chequeNumber: null,
      bankNumber: "ABSA-MU-02",
      preparedBy: "A. Fernandes",
      approvalToPay: "S. Patel",
      receiverName: "SICOM Underwriting Services",
      signedPrepared: true,
      signedApprover: false,
      signedReceiver: false,
      createdById: makerUser.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Voucher created", actor: "A. Fernandes", timestamp: new Date("2026-03-08T11:00:00Z") },
        { type: "submitted", label: "Submitted for approval", actor: "A. Fernandes", timestamp: new Date("2026-03-08T11:20:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "A. Fernandes", note: "Voucher record created" },
        { action: "voucher:submit", actorName: "A. Fernandes", note: "Submitted for approval" },
      ],
    },
    {
      voucherNumber: "PV-10004",
      date: new Date("2026-03-10"),
      status: VoucherStatus.DRAFT,
      paymentType: PaymentType.BANK_TRANSFER,
      payeeName: "PwC Mauritius",
      payeeAddress: "PwC Centre, Avenue de Telfair, Moka",
      payeePhone: "+230 404 5000",
      payeeBankName: "The Mauritius Commercial Bank Ltd (MCB)",
      payeeBankAccount: "000333444555",
      description: "Interim statutory audit & IFRS 17 advisory services — Milestone 2",
      invoiceNumber: "PWC-MU-8831",
      amount: 320000.0,
      currency: "INR",
      chequeNumber: null,
      bankNumber: "MCB-MOKA-01",
      preparedBy: "A. Fernandes",
      approvalToPay: "S. Patel",
      receiverName: "PwC Mauritius — Advisory",
      signedPrepared: false,
      signedApprover: false,
      signedReceiver: false,
      createdById: makerUser.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Draft created", actor: "A. Fernandes", timestamp: new Date("2026-03-10T14:00:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "A. Fernandes", note: "Draft created" },
      ],
    },
  ];

  for (const item of sampleVouchers) {
    const { timeline, auditLog, ...data } = item;
    const existing = await prisma.voucher.findUnique({
      where: { voucherNumber: data.voucherNumber },
    });

    if (!existing) {
      const v = await prisma.voucher.create({
        data,
      });

      for (const t of timeline) {
        await prisma.voucherTimelineEvent.create({
          data: {
            voucherId: v.id,
            type: t.type,
            label: t.label,
            actor: t.actor,
            timestamp: t.timestamp,
          },
        });
      }

      for (const a of auditLog) {
        await prisma.voucherAuditEvent.create({
          data: {
            voucherId: v.id,
            tenantId: org.id,
            actorId: makerUser.id,
            actorName: a.actorName,
            action: a.action,
            note: a.note,
          },
        });
      }
    }
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
