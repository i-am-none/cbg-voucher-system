"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CalendarClock,
  Building2,
  Building,
  User,
  CreditCard,
  FileText,
  DollarSign,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import {
  scheduledVoucherFormSchema,
  type ScheduledVoucherFormValues,
  SCHEDULED_DEFAULT_VALUES,
} from "@/lib/validation";
import { PaymentType } from "@/lib/types";
import { SUBSIDIARIES } from "@/lib/master-data/subsidiaries";
import { findCreditorByName, CREDITORS } from "@/lib/master-data/creditors";
import { MAKERS, APPROVERS, CURRENCIES } from "@/lib/constants";
import { createScheduledVoucherAction } from "@/server/scheduled-vouchers";
import { useSession } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ScheduledVoucherForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: ScheduledVoucherFormValues = useMemo(
    () => ({
      ...SCHEDULED_DEFAULT_VALUES,
      scheduledDate: getTomorrowString(),
      authorization: {
        preparedBy: (session?.user?.name as string) || "Thasha",
        approvalToPay: "Anoop",
        receiverName: "",
      },
    }),
    [session]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ScheduledVoucherFormValues>({
    resolver: zodResolver(scheduledVoucherFormSchema) as any,
    defaultValues,
    mode: "onSubmit",
  });

  const selectedSubsidiary = watch("subsidiary") || "chartered-brokers";
  const activeSubsidiary =
    SUBSIDIARIES[selectedSubsidiary] || SUBSIDIARIES["chartered-brokers"];
  const companyAccounts = activeSubsidiary.bankAccounts;

  const paymentType = watch("paymentType");
  const isCheque = paymentType === PaymentType.CHEQUE;

  // Auto-fill bank details when payee name matches a known creditor
  const handlePayeeNameChange = (nameInput: string) => {
    setValue("payee.name", nameInput);
    const matched = findCreditorByName(nameInput);
    if (matched) {
      setValue("payee.bankName", matched.bankName);
      setValue("payee.bankAccount", matched.bankAccount);
      toast.success(`Auto-filled details for ${matched.name}`, {
        description: `Bank: ${matched.bankName} • A/C: ${matched.bankAccount}`,
      });
    }
  };

  const onSubmit = async (values: ScheduledVoucherFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await createScheduledVoucherAction(values);
      if (res.success) {
        toast.success("Voucher scheduled successfully!", {
          description: `Scheduled for generation on ${values.scheduledDate}`,
        });
        router.push("/vouchers/scheduled");
      } else {
        toast.error("Failed to schedule voucher", {
          description: res.error || "Please check the form fields and try again.",
        });
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred", {
        description: err?.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl">
      {/* 1. Target Schedule & Corporate Subsidiary */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Execution Schedule & Corporate Subsidiary
            </CardTitle>
          </div>
          <CardDescription>
            Choose the target day for this voucher to be generated, and select the responsible CBG entity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Date */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Generation Date *
              </Label>
              <Input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                {...register("scheduledDate")}
                className="mt-1.5"
              />
              {errors.scheduledDate && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.scheduledDate.message}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                The voucher will be primed with all pre-filled details for this date.
              </p>
            </div>

            {/* Target Status when generated */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status Upon Generation
              </Label>
              <Controller
                name="initialStatus"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "pending-approval")}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select target status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending-approval">
                        Pending Approval (Ready for Approver)
                      </SelectItem>
                      <SelectItem value="draft">
                        Draft (Keep as editable draft)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Subsidiary Selection */}
          <div className="pt-2 border-t border-border/40">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Corporate Subsidiary *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue("subsidiary", "chartered-brokers");
                  setValue("banking.bankNumber", "");
                }}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  selectedSubsidiary === "chartered-brokers"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mt-0.5">
                  <Building2 className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Chartered Brokers Ltd</span>
                    {selectedSubsidiary === "chartered-brokers" && (
                      <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Primary insurance & financial broking entity (Reg: C06001234)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue("subsidiary", "medibroker");
                  setValue("banking.bankNumber", "");
                }}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  selectedSubsidiary === "medibroker"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mt-0.5">
                  <Building className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Medibroker Ltd</span>
                    {selectedSubsidiary === "medibroker" && (
                      <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Specialized healthcare & medical insurance brokerage
                  </p>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Creditor / Payee with Auto-fill */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                Creditor / Payee Information
              </CardTitle>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md font-medium">
              <Sparkles className="size-3.5" />
              Auto-fill from Master Creditors
            </span>
          </div>
          <CardDescription>
            Enter creditor name. Known suppliers will automatically populate bank account and banking details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Creditor / Payee Name *
              </Label>
              <Input
                placeholder="e.g. CENTRAL ELECTRICITY BOARD, MAURITIUS TELECOM..."
                list="creditor-suggestions"
                {...register("payee.name")}
                onChange={(e) => handlePayeeNameChange(e.target.value)}
                className="mt-1.5"
              />
              <datalist id="creditor-suggestions">
                {CREDITORS.slice(0, 50).map((c, i) => (
                  <option key={i} value={c.name}>
                    {c.bankName} - A/C: {c.bankAccount}
                  </option>
                ))}
              </datalist>
              {errors.payee?.name && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.payee.name.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payee Phone
              </Label>
              <Input
                placeholder="+230 ..."
                {...register("payee.phone")}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payee Physical / Postal Address
            </Label>
            <Input
              placeholder="e.g. Cybercity, Ebene"
              {...register("payee.address")}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payee Bank Name
              </Label>
              <Input
                placeholder="e.g. MCB, SBM, Absa Bank..."
                {...register("payee.bankName")}
                className="mt-1.5 bg-muted/20"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payee Bank Account Number
              </Label>
              <Input
                placeholder="Account number..."
                {...register("payee.bankAccount")}
                className="mt-1.5 bg-muted/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Payment Details & Amount */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Payment Specifics & Amount
            </CardTitle>
          </div>
          <CardDescription>
            Specify payment purpose, invoice reference, and amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Description / Particulars of Service *
            </Label>
            <Textarea
              rows={2}
              placeholder="Detailed description of invoice or service to be paid..."
              {...register("payment.description")}
              className="mt-1.5"
            />
            {errors.payment?.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.payment.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Invoice Reference #
              </Label>
              <Input
                placeholder="e.g. INV-2026-4401"
                {...register("payment.invoiceNumber")}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Amount (Rs.) *
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("payment.amount")}
                className="mt-1.5 font-mono text-base"
              />
              {errors.payment?.amount && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.payment.amount.message}
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Currency
              </Label>
              <Controller
                name="payment.currency"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "MUR")}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Subsidiary Credited Bank Account & Payment Method */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Credited Corporate Bank Account & Method
            </CardTitle>
          </div>
          <CardDescription>
            Account belonging to {activeSubsidiary.name} from which funds will be credited.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Company Account to Credit From
              </Label>
              <Controller
                name="banking.bankNumber"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "")}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select corporate account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {companyAccounts.map((acc, idx) => (
                        <SelectItem
                          key={idx}
                          value={`${acc.bankName} - ${acc.accountNumber} (${acc.use})`}
                        >
                          {acc.use} • {acc.bankName} ({acc.currency}) • A/C {acc.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Type
              </Label>
              <Controller
                name="paymentType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || PaymentType.BANK_TRANSFER)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentType.BANK_TRANSFER}>
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value={PaymentType.CHEQUE}>Cheque</SelectItem>
                      <SelectItem value={PaymentType.CASH}>Cash</SelectItem>
                      <SelectItem value={PaymentType.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {isCheque && (
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cheque Number
              </Label>
              <Input
                placeholder="Cheque leaf number..."
                {...register("banking.chequeNumber")}
                className="mt-1.5"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Authorization & Workflow Assignment */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Maker & Approver Assignment
            </CardTitle>
          </div>
          <CardDescription>
            Assigned maker (Thasha / Ravi) and designated approver (Anoop / Ashwina).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prepared By (Maker) *
              </Label>
              <Controller
                name="authorization.preparedBy"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "Thasha")}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MAKERS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m} (Maker)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Approval To Pay (Approver) *
              </Label>
              <Controller
                name="authorization.approvalToPay"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => field.onChange(val || "Anoop")}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVERS.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a} (Approver)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/vouchers/scheduled")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            "Scheduling..."
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              Schedule Voucher
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
