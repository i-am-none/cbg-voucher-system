"use client";

import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { VoucherForm } from "@/components/vouchers/VoucherForm";
import { buttonVariants } from "@/components/ui/button";
import { useVouchers } from "@/lib/voucher-store";

export default function CreateVoucherPage() {
  const { currentVoucherNumber } = useVouchers();

  return (
    <>
      <PageHeader
        icon={
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FilePlus2 className="size-5" />
          </div>
        }
        title="Create Voucher"
        description="Fill in the payment details, then save as draft or submit for approval."
        actions={
          <Link
            href="/vouchers"
            className={buttonVariants({ variant: "outline", size: "default" })}
          >
            <ArrowLeft />
            Back to History
          </Link>
        }
      />
      <VoucherForm defaultVoucherNumber={currentVoucherNumber} />
    </>
  );
}