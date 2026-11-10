import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, VoucherStatus, PaymentType } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

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

  const demoPassword = "cbgDemo2026!";
  const hashedPassword = await hashPassword(demoPassword);

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

  // 3. Create Real Role Users
  const thashaMaker = await prisma.user.upsert({
    where: { email: "thasha@charteredbrokers.com" },
    update: { name: "Thasha", role: "maker" },
    create: {
      name: "Thasha",
      email: "thasha@charteredbrokers.com",
      role: "maker",
      emailVerified: true,
    },
  });

  const raviMaker = await prisma.user.upsert({
    where: { email: "ravi@charteredbrokers.com" },
    update: { name: "Ravi", role: "maker" },
    create: {
      name: "Ravi",
      email: "ravi@charteredbrokers.com",
      role: "maker",
      emailVerified: true,
    },
  });

  const ashwinaApprover = await prisma.user.upsert({
    where: { email: "ashwina@charteredbrokers.com" },
    update: { name: "Ashwina", role: "approver" },
    create: {
      name: "Ashwina",
      email: "ashwina@charteredbrokers.com",
      role: "approver",
      emailVerified: true,
    },
  });

  const anoopAdmin = await prisma.user.upsert({
    where: { email: "anoop@charteredbrokers.com" },
    update: { name: "Anoop", role: "admin" },
    create: {
      name: "Anoop",
      email: "anoop@charteredbrokers.com",
      role: "admin",
      emailVerified: true,
    },
  });

  // Associate members to Organization and create Credentials Account
  for (const memberUser of [
    { user: thashaMaker, role: "maker" },
    { user: raviMaker, role: "maker" },
    { user: ashwinaApprover, role: "approver" },
    { user: anoopAdmin, role: "admin" },
  ]) {
    await prisma.member.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: memberUser.user.id,
        },
      },
      update: { role: memberUser.role },
      create: {
        organizationId: org.id,
        userId: memberUser.user.id,
        role: memberUser.role,
      },
    });

    // Create or update credential Account record for Better Auth
    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: memberUser.user.id,
        },
      },
      update: {
        password: hashedPassword,
        issuer: "local:credential",
      },
      create: {
        userId: memberUser.user.id,
        accountId: memberUser.user.id,
        providerId: "credential",
        issuer: "local:credential",
        password: hashedPassword,
      },
    });
  }

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
      preparedBy: "Thasha",
      approvalToPay: "Anoop",
      receiverName: "Swan General Ltd — Claims Dept",
      signedPrepared: true,
      signedApprover: true,
      signedReceiver: true,
      createdById: thashaMaker.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Voucher created", actor: "Thasha", timestamp: new Date("2026-03-01T09:00:00Z") },
        { type: "submitted", label: "Submitted for approval", actor: "Thasha", timestamp: new Date("2026-03-01T10:15:00Z") },
        { type: "approved", label: "Approved by Finance Director", actor: "Anoop", timestamp: new Date("2026-03-02T14:30:00Z") },
        { type: "paid", label: "Payment completed via MCB Direct", actor: "Anoop", timestamp: new Date("2026-03-03T11:00:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "Thasha", note: "Voucher record created" },
        { action: "voucher:submit", actorName: "Thasha", note: "Submitted for approval" },
        { action: "voucher:approve", actorName: "Anoop", note: "Approved by Anoop" },
        { action: "voucher:paid", actorName: "Anoop", note: "Payment completed" },
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
      preparedBy: "Ravi",
      approvalToPay: "Ashwina",
      receiverName: "Mauritius Telecom Accounts",
      signedPrepared: true,
      signedApprover: true,
      signedReceiver: false,
      createdById: raviMaker.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Voucher created", actor: "Ravi", timestamp: new Date("2026-03-05T08:30:00Z") },
        { type: "submitted", label: "Submitted for approval", actor: "Ravi", timestamp: new Date("2026-03-05T09:45:00Z") },
        { type: "approved", label: "Approved by Operations Lead", actor: "Ashwina", timestamp: new Date("2026-03-06T10:00:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "Ravi", note: "Voucher record created" },
        { action: "voucher:submit", actorName: "Ravi", note: "Submitted for approval" },
        { action: "voucher:approve", actorName: "Ashwina", note: "Approved by Ashwina" },
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
      preparedBy: "Thasha",
      approvalToPay: "Anoop",
      receiverName: "SICOM Underwriting Services",
      signedPrepared: true,
      signedApprover: false,
      signedReceiver: false,
      createdById: thashaMaker.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Voucher created", actor: "Thasha", timestamp: new Date("2026-03-08T11:00:00Z") },
        { type: "submitted", label: "Submitted for approval", actor: "Thasha", timestamp: new Date("2026-03-08T11:20:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "Thasha", note: "Voucher record created" },
        { action: "voucher:submit", actorName: "Thasha", note: "Submitted for approval" },
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
      preparedBy: "Ravi",
      approvalToPay: "Anoop",
      receiverName: "PwC Mauritius — Advisory",
      signedPrepared: false,
      signedApprover: false,
      signedReceiver: false,
      createdById: raviMaker.id,
      tenantId: org.id,
      timeline: [
        { type: "created", label: "Draft created", actor: "Ravi", timestamp: new Date("2026-03-10T14:00:00Z") },
      ],
      auditLog: [
        { action: "voucher:create", actorName: "Ravi", note: "Draft created" },
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
            actorId: thashaMaker.id,
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
