import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "better-auth/crypto";

// Allowed designated demo accounts
const ALLOWED_DEMO_ACCOUNTS: Record<string, { name: string; role: string }> = {
  "thasha@charteredbrokers.com": { name: "Thasha", role: "maker" },
  "ravi@charteredbrokers.com": { name: "Ravi", role: "maker" },
  "ashwina@charteredbrokers.com": { name: "Ashwina", role: "approver" },
  "anoop@charteredbrokers.com": { name: "Anoop", role: "admin" },
};

const DEMO_PASSWORD = "cbgDemo2026!";

/**
 * Ensures the requested demo user exists with a valid credential account and organization membership.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.toLowerCase().trim();

    if (!email || !ALLOWED_DEMO_ACCOUNTS[email]) {
      return NextResponse.json(
        { error: "Invalid demo account specified." },
        { status: 400 }
      );
    }

    const { name, role } = ALLOWED_DEMO_ACCOUNTS[email];
    const hashedPassword = await hashPassword(DEMO_PASSWORD);

    // 1. Ensure user exists
    const user = await db.user.upsert({
      where: { email },
      update: { name, role, emailVerified: true },
      create: {
        name,
        email,
        role,
        emailVerified: true,
      },
    });

    // 2. Ensure credential account exists with the correct password hash
    await db.account.upsert({
      where: {
        providerId_accountId: {
          providerId: "credential",
          accountId: user.id,
        },
      },
      update: {
        password: hashedPassword,
        issuer: "local:credential",
      },
      create: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        issuer: "local:credential",
        password: hashedPassword,
      },
    });

    // 3. Ensure organization membership
    const org = await db.organization.findFirst({
      where: { slug: "cbg-mauritius" },
    });

    if (org) {
      await db.member.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        update: { role },
        create: {
          organizationId: org.id,
          userId: user.id,
          role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Account for ${name} verified and ready.`,
    });
  } catch (error) {
    console.error("Failed to provision demo account:", error);
    return NextResponse.json(
      { error: "Failed to prepare demo credentials." },
      { status: 500 }
    );
  }
}
