"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Banknote,
  Building2,
  CalendarDays,
  FileText,
  PenLine,
  Save,
  Send,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormInput } from "@/components/shared/FormInput";
import { FormSelect } from "@/components/shared/FormSelect";
import { FormTextarea } from "@/components/shared/FormTextarea";
import { SignatureBox } from "@/components/vouchers/SignatureBox";
import { VoucherSection } from "@/components/vouchers/VoucherSection";
import {
  CURRENCIES,
  PAYMENT_TYPE_OPTIONS,
} from "@/lib/constants";
import { formatCurrency, toISODate } from "@/lib/format";
import { PaymentType, VoucherStatus } from "@/lib/types";
import {
  DRAFT_DEFAULT_VALUES,
  voucherFormSchema,
  type VoucherFormValues,
} from "@/lib/validation";
import { useVouchers } from "@/lib/voucher-store";
import { useSession } from "@/lib/auth-client";

interface VoucherFormProps {
  defaultVoucherNumber?: string;
}

export function VoucherForm({ defaultVoucherNumber }: VoucherFormProps) {
  const router = useRouter();
  const { createVoucher } = useVouchers();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<VoucherFormValues | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const modeRef = useRef<"draft" | "submit">("submit");

  const currencyOptions = useMemo(
    () => CURRENCIES.map((currency) => ({ value: currency, label: currency })),
    []
  );

  const defaultValues = useMemo<VoucherFormValues>(
    () => ({
      ...DRAFT_DEFAULT_VALUES,
      voucherInfo: {
        ...DRAFT_DEFAULT_VALUES.voucherInfo,
        voucherNumber: defaultVoucherNumber ?? "",
        date: toISODate(new Date()),
      },
    }),
    [defaultVoucherNumber]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherFormSchema) as any,
    defaultValues,
    mode: "onSubmit",
  });

  const { data: session } = useSession();

  useEffect(() => {
    if (defaultVoucherNumber) {
      const current = watch("voucherInfo.voucherNumber");
      if (!current) {
        setValue("voucherInfo.voucherNumber", defaultVoucherNumber);
      }
    }
    if (session?.user?.name) {
      const currentPreparedBy = watch("authorization.preparedBy");
      if (!currentPreparedBy || currentPreparedBy === DRAFT_DEFAULT_VALUES.authorization.preparedBy) {
        setValue("authorization.preparedBy", session.user.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultVoucherNumber, session, setValue]);

  const paymentType = watch("voucherInfo.paymentType");
  const isCheque = paymentType === PaymentType.CHEQUE;

  const fillTestData = () => {
    setValue("voucherInfo.date", toISODate(new Date()));
    setValue("voucherInfo.paymentType", PaymentType.BANK_TRANSFER);
    setValue("payee.name", "Swan General Ltd");
    setValue("payee.phone", "+230 207 3500");
    setValue("payee.address", "Swan Centre, 10 Intendance Street, Port Louis");
    setValue("payee.bankName", "The Mauritius Commercial Bank Ltd (MCB)");
    setValue("payee.bankAccount", "000123456789");
    setValue("payment.description", "Co-insurance settlement premium — Q1 2026");
    setValue("payment.invoiceNumber", `INV-2026-${Date.now().toString().slice(-4)}`);
    setValue("payment.amount", 45000);
    setValue("payment.currency", "INR");
    setValue("banking.bankNumber", "MCB-PL-01");
    setValue("authorization.preparedBy", session?.user?.name || "A. Fernandes");
    setValue("authorization.approvalToPay", "S. Patel");
    setValue("authorization.receiverName", "Swan General Claims Department");
    toast.info("Pre-filled form with sample test data");
  };

  const save = async (
    values: VoucherFormValues,
    status: VoucherStatus,
    successMessage: string
  ) => {
    try {
      setIsSaving(true);
      const voucher = await createVoucher(values, status);
      toast.success(successMessage, {
        description: `${voucher.voucherNumber} • ${formatCurrency(
          voucher.payment.amount,
          voucher.payment.currency
        )}`,
      });
      router.push(`/vouchers/${voucher.id}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save voucher";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const onValid = (values: VoucherFormValues) => {
    const mode = modeRef.current;
    if (mode === "draft") {
      save(values, VoucherStatus.DRAFT, "Voucher saved as draft");
      return;
    }
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const requestSubmit = (mode: "draft" | "submit") => {
    modeRef.current = mode;
    void handleSubmit(onValid)();
  };

  const confirmSubmit = () => {
    if (!pendingValues) return;
    save(
      pendingValues,
      VoucherStatus.PENDING_APPROVAL,
      "Voucher submitted for approval"
    );
    setPendingValues(null);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          🧪 Testing Mode: All fields are optional. Leave blank or fill partial data.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fillTestData}
          className="text-xs"
        >
          <Sparkles className="size-3.5" />
          Fill Test Data
        </Button>
      </div>
      <form onSubmit={handleSubmit(onValid)} noValidate>
        <div className="space-y-5">
          <VoucherSection
            title="Voucher Information"
            description="Serial number, date and payment method (optional for testing)"
            icon={FileText}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <FormInput
              label="Voucher Number (PV No.)"
              placeholder="Auto-generated if left blank"
              error={errors.voucherInfo?.voucherNumber?.message}
              {...register("voucherInfo.voucherNumber")}
            />
            <FormInput
              label="Date"
              type="date"
              error={errors.voucherInfo?.date?.message}
              {...register("voucherInfo.date")}
            />
            <FormSelect
              control={control}
              name="voucherInfo.paymentType"
              label="Payment Type"
              options={PAYMENT_TYPE_OPTIONS}
              placeholder="Select payment type"
              error={errors.voucherInfo?.paymentType?.message}
            />
          </VoucherSection>

          <VoucherSection
            title="Payee Information"
            description="Details of the party receiving the payment (optional for testing)"
            icon={UserRound}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <FormInput
              label="Payee Name"
              placeholder="Full name or company name (defaults to 'Test Payee')"
              error={errors.payee?.name?.message}
              {...register("payee.name")}
            />
            <FormInput
              label="Phone Number"
              placeholder="+230 207 3500"
              inputMode="tel"
              error={errors.payee?.phone?.message}
              {...register("payee.phone")}
            />
            <div className="sm:col-span-2">
              <FormInput
                label="Address"
                placeholder="Street, city, state, PIN code"
                error={errors.payee?.address?.message}
                {...register("payee.address")}
              />
            </div>
            <FormInput
              label="Bank Name"
              placeholder="e.g. MCB Ltd / SBM Ltd"
              error={errors.payee?.bankName?.message}
              {...register("payee.bankName")}
            />
            <FormInput
              label="Bank Account Number"
              placeholder="Account number"
              inputMode="numeric"
              error={errors.payee?.bankAccount?.message}
              {...register("payee.bankAccount")}
            />
          </VoucherSection>

          <VoucherSection
            title="Payment Details"
            description="What is being paid and the total amount (optional for testing)"
            icon={Banknote}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <FormTextarea
                label="Payment Description"
                placeholder="Describe the purpose of the payment"
                error={errors.payment?.description?.message}
                {...register("payment.description")}
              />
            </div>
            <FormInput
              label="Invoice Number"
              placeholder="INV-2026-XXXX"
              error={errors.payment?.invoiceNumber?.message}
              {...register("payment.invoiceNumber")}
            />
            <div className="grid grid-cols-[1fr_110px] gap-2">
              <FormInput
                label="Amount (Rs.)"
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                error={errors.payment?.amount?.message}
                className="[&::-webkit-inner-spin-button]:appearance-none"
                {...register("payment.amount")}
              />
              <FormSelect
                control={control}
                name="payment.currency"
                label="Currency"
                options={currencyOptions}
                error={errors.payment?.currency?.message}
              />
            </div>
          </VoucherSection>

          <VoucherSection
            title="Banking Information"
            description="Banking references for the payment"
            icon={Building2}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <FormInput
              label="Cheque Number"
              placeholder="e.g. 458123"
              hint={
                isCheque
                  ? "Required when paying by cheque"
                  : "Only for cheque payments"
              }
              error={errors.banking?.chequeNumber?.message}
              {...register("banking.chequeNumber")}
            />
            <FormInput
              label="Bank Number"
              placeholder="Branch / bank reference"
              hint="Optional reference for tracking"
              error={errors.banking?.bankNumber?.message}
              {...register("banking.bankNumber")}
            />
          </VoucherSection>

          <VoucherSection
            title="Authorization"
            description="People responsible for preparing and approving the payment (optional for testing)"
            icon={PenLine}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <FormInput
              label="Prepared By"
              placeholder="Name of preparer"
              error={errors.authorization?.preparedBy?.message}
              {...register("authorization.preparedBy")}
            />
            <FormInput
              label="Approval To Pay"
              placeholder="Name of approver"
              error={errors.authorization?.approvalToPay?.message}
              {...register("authorization.approvalToPay")}
            />
            <FormInput
              label="Name Of Receiver"
              placeholder="Person receiving the payment"
              error={errors.authorization?.receiverName?.message}
              {...register("authorization.receiverName")}
            />

            <Separator className="sm:col-span-2" />

            <div className="sm:col-span-2">
              <div className="mb-3">
                <p className="text-sm font-medium">Signatures</p>
                <p className="text-xs text-muted-foreground">
                  Signature placeholders — e-signature capture arrives in a
                  later phase
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <SignatureBox label="Prepared By Signature" />
                <SignatureBox label="Approver Signature" />
                <SignatureBox label="Receiver Signature" />
              </div>
            </div>
          </VoucherSection>
        </div>

        <Card className="sticky bottom-4 z-10 mt-6">
          <CardFooter className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              <CalendarDays className="mr-1 inline size-3" />
              Connected to Neon PostgreSQL • All fields optional for testing
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fillTestData}
                className="hidden sm:inline-flex"
              >
                <Sparkles className="size-4" />
                Fill Test Data
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => requestSubmit("draft")}
                disabled={isSaving}
              >
                <Save className="size-4" />
                Save as Draft
              </Button>
              <Button
                type="submit"
                onClick={() => {
                  modeRef.current = "submit";
                }}
                disabled={isSaving}
              >
                <Send className="size-4" />
                Submit for Approval
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit voucher for approval?"
        confirmLabel="Submit for Approval"
        loading={isSaving}
        onConfirm={confirmSubmit}
        description={
          <div className="flex flex-col gap-1">
            <span>
              You are about to submit{" "}
              <span className="font-medium text-foreground">
                {pendingValues?.voucherInfo.voucherNumber || defaultVoucherNumber || "PV-AUTO"}
              </span>{" "}
              to the approval queue.
            </span>
            <span>
              Payee:{" "}
              <span className="font-medium text-foreground">
                {pendingValues?.payee.name || "Test Payee"}
              </span>
            </span>
            <span>
              Amount:{" "}
              <span className="font-medium text-foreground">
                {pendingValues
                  ? formatCurrency(
                      pendingValues.payment.amount || 0,
                      pendingValues.payment.currency || "INR"
                    )
                  : ""}
              </span>
            </span>
          </div>
        }
      />
    </div>
  );
}