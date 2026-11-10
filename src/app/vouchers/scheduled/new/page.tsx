"use client";

import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { ScheduledVoucherForm } from "@/components/vouchers/ScheduledVoucherForm";
import { buttonVariants } from "@/components/ui/button";

export default function NewScheduledVoucherPage() {
  return (
    <>
      <PageHeader
        icon={
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarPlus className="size-5" />
          </div>
        }
        title="Schedule Future Voucher"
        description="Pre-fill all payment, creditor, and banking details to be generated on a specified date."
        actions={
          <Link
            href="/vouchers/scheduled"
            className={buttonVariants({ variant: "outline", size: "default" })}
          >
            <ArrowLeft className="size-4" />
            Back to Scheduled Vouchers
          </Link>
        }
      />
      <div className="py-4">
        <ScheduledVoucherForm />
      </div>
    </>
  );
}
