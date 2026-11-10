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
  Check,
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
  MAKERS,
  APPROVERS,
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
import {
  SUBSIDIARIES,
  SUBSIDIARY_OPTIONS,
} from "@/lib/master-data/subsidiaries";
import { CREDITORS, findCreditorByName } from "@/lib/master-data/creditors";
import { cn } from "@/lib/utils";

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

  const makerOptions = useMemo(
    () => MAKERS.map((maker) => ({ value: maker, label: `${maker} (Maker)` })),
    []
  );

  const approverOptions = useMemo(
    () => APPROVERS.map((appr) => ({ value: appr, label: `${appr} (Approver)` })),
    []
  );

  const defaultValues = useMemo<VoucherFormValues>(
    () => ({
      ...DRAFT_DEFAULT_VALUES,
      voucherInfo: {
        ...DRAFT_DEFAULT_VALUES.voucherInfo,
        subsidiary: "chartered-brokers",
        voucherNumber: "",
        date: toISODate(new Date()),
      },
      authorization: {
        ...DRAFT_DEFAULT_VALUES.authorization,
        preparedBy: "Thasha",
        approvalToPay: "Anoop",
      },
    }),
    []
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

  const selectedSubsidiary = (watch("voucherInfo.subsidiary") || "chartered-brokers") as
    | "chartered-brokers"
    | "medibroker";

  // Corporate bank accounts for the selected subsidiary
  const activeSubsidiary = SUBSIDIARIES[selectedSubsidiary] || SUBSIDIARIES["chartered-brokers"];
  const companyAccounts = activeSubsidiary.bankAccounts;

  const companyAccountSelectOptions = useMemo(() => {
    return [
      { value: "", label: "Select account to credit from..." },
      ...companyAccounts.map((acc) => ({
        value: `${acc.bankName} - ${acc.accountNumber} (${acc.use})`,
        label: `${acc.use} • ${acc.bankName} (${acc.currency}) • A/C ${acc.accountNumber}`,
      })),
    ];
  }, [companyAccounts]);

  useEffect(() => {
    if (session?.user?.name) {
      const currentPreparedBy = watch("authorization.preparedBy");
      if (
        !currentPreparedBy ||
        currentPreparedBy === DRAFT_DEFAULT_VALUES.authorization.preparedBy
      ) {
        setValue("authorization.preparedBy", session.user.name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, setValue]);

  const paymentType = watch("voucherInfo.paymentType");
  const isCheque = paymentType === PaymentType.CHEQUE;

  // Auto-fill bank details when payee name matches a known creditor
  const handlePayeeNameChange = (nameInput: string) => {
    setValue("payee.name", nameInput);
    const matched = findCreditorByName(nameInput);
    if (matched) {
      setValue("payee.bankName", matched.bankName);
      setValue("payee.bankAccount", matched.bankAccount);
      toast.success(`Auto-filled bank details for ${matched.name}`, {
        description: `Bank: ${matched.bankName} • A/C: ${matched.bankAccount}`,
      });
    }
  };

  // Quick select a creditor from the master directory
  const handleQuickSelectCreditor = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const creditorName = e.target.value;
    if (!creditorName) return;
    const creditor = CREDITORS.find((c) => c.name === creditorName);
    if (creditor) {
      setValue("payee.name", creditor.name);
      setValue("payee.bankName", creditor.bankName);
      setValue("payee.bankAccount", creditor.bankAccount);
      toast.success(`Selected creditor: ${creditor.name}`, {
        description: `${creditor.bankName} • Account: ${creditor.bankAccount}`,
      });
    }
  };

  // When user selects a company bank account to credit from
  const handleCompanyAccountSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setValue("banking.bankNumber", val);
    const foundAcc = companyAccounts.find(
      (a) => `${a.bankName} - ${a.accountNumber} (${a.use})` === val
    );
    if (foundAcc) {
      setValue("payment.currency", foundAcc.currency);
      toast.info(`Selected credited account (${foundAcc.currency})`);
    }
  };

  const fillTestData = () => {
    setValue("voucherInfo.subsidiary", "chartered-brokers");
    setValue("voucherInfo.date", toISODate(new Date()));
    setValue("voucherInfo.paymentType", PaymentType.BANK_TRANSFER);
    setValue("payee.name", "SWAN");
    setValue("payee.phone", "+230 207 3500");
    setValue("payee.address", "Swan Centre, 10 Intendance Street, Port Louis");
    setValue("payee.bankName", "MCB");
    setValue("payee.bankAccount", "000200702513");
    setValue("payment.description", "Co-insurance settlement premium — Q1 2026");
    setValue("payment.invoiceNumber", `INV-2026-${Date.now().toString().slice(-4)}`);
    setValue("payment.amount", 45000);
    setValue("payment.currency", "MUR");
    setValue("banking.bankNumber", "The Mauritius Commercial Bank Ltd (MCB) - 000010312102 (Admin (MUR) expenses only)");
    setValue("authorization.preparedBy", session?.user?.name || "Thasha");
    setValue("authorization.approvalToPay", "Anoop");
    setValue("authorization.receiverName", "Swan Finance Claims Department");
    toast.info("Pre-filled form with verified CBG test data");
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
      {/* Subsidiary Selection Banner */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select Subsidiary / Corporate Association
        </label>
        <p className="mb-3 text-xs text-muted-foreground">
          Choose whether this voucher is issued for Chartered Brokers Ltd or Medibroker Ltd (Medi Broker).
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUBSIDIARY_OPTIONS.map((sub) => {
            const isSelected = selectedSubsidiary === sub.value;
            const subData = SUBSIDIARIES[sub.value as keyof typeof SUBSIDIARIES];
            return (
              <button
                type="button"
                key={sub.value}
                onClick={() => {
                  setValue("voucherInfo.subsidiary", sub.value);
                  // Reset credited account selection to empty when switching subsidiary
                  setValue("banking.bankNumber", "");
                }}
                className={cn(
                  "relative flex flex-col items-start rounded-lg border p-3.5 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">
                    {sub.label}
                  </span>
                  {isSelected && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>BRN: {subData.brn}</span>
                  <span>•</span>
                  <span>VAT: {subData.vat}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
            description="Serial number, date and payment method"
            icon={FileText}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <FormInput
              label="Voucher Number (PV No.)"
              placeholder={defaultVoucherNumber ? `Auto-generated (e.g. ${defaultVoucherNumber})` : "Auto-generated"}
              hint="Leave blank to automatically assign the next available number"
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
            description="Party receiving the payment (select or type name for instant bank auto-fill)"
            icon={UserRound}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            {/* Quick Creditor Autocomplete Selector */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                ⚡ Quick Select Existing Creditor / Payee
              </label>
              <select
                onChange={handleQuickSelectCreditor}
                defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">-- Or choose from creditor directory ({CREDITORS.length} creditors) --</option>
                {CREDITORS.map((c) => (
                  <option key={`${c.name}-${c.bankAccount}`} value={c.name}>
                    {c.name} ({c.bankName} - A/C {c.bankAccount})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-1">
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Payee Name
              </label>
              <input
                list="creditor-suggestions"
                placeholder="Enter or search creditor name"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("payee.name", {
                  onChange: (e) => handlePayeeNameChange(e.target.value),
                })}
              />
              <datalist id="creditor-suggestions">
                {CREDITORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.bankName} • A/C {c.bankAccount}
                  </option>
                ))}
              </datalist>
              {errors.payee?.name?.message && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.payee.name.message}
                </p>
              )}
            </div>

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
              label="Payee Bank Name"
              placeholder="e.g. MCB Ltd / SBM Ltd"
              error={errors.payee?.bankName?.message}
              {...register("payee.bankName")}
            />
            <FormInput
              label="Payee Bank Account Number"
              placeholder="Account number"
              inputMode="numeric"
              error={errors.payee?.bankAccount?.message}
              {...register("payee.bankAccount")}
            />
          </VoucherSection>

          <VoucherSection
            title="Payment Details"
            description="What is being paid and the total amount"
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
            title="Banking Information & Credited Account"
            description="Specify which account the money is credited/debited from"
            icon={Building2}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            {/* Account from which money is credited */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Credited From Account ({activeSubsidiary.name})
              </label>
              <select
                value={watch("banking.bankNumber") || ""}
                onChange={handleCompanyAccountSelect}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {companyAccountSelectOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Corporate account details from {activeSubsidiary.shortName} bank master list
              </p>
            </div>

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
              label="Custom Banking Reference"
              placeholder="Branch or bank reference note"
              hint="Selected account or custom bank reference"
              error={errors.banking?.bankNumber?.message}
              {...register("banking.bankNumber")}
            />
          </VoucherSection>

          <VoucherSection
            title="Authorization & Roles"
            description="Maker and Approver assignment"
            icon={PenLine}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <FormSelect
              control={control}
              name="authorization.preparedBy"
              label="Prepared By (Maker)"
              options={makerOptions}
              error={errors.authorization?.preparedBy?.message}
            />

            <FormSelect
              control={control}
              name="authorization.approvalToPay"
              label="Approval To Pay (Approver)"
              options={approverOptions}
              error={errors.authorization?.approvalToPay?.message}
            />

            <div className="sm:col-span-2">
              <FormInput
                label="Name Of Receiver"
                placeholder="Person or department receiving the payment"
                error={errors.authorization?.receiverName?.message}
                {...register("authorization.receiverName")}
              />
            </div>

            <Separator className="sm:col-span-2" />

            <div className="sm:col-span-2">
              <div className="mb-3">
                <p className="text-sm font-medium">Signatures</p>
                <p className="text-xs text-muted-foreground">
                  Signature placeholders — e-signature capture arrives in a later phase
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
              {activeSubsidiary.name} • Connected to Neon PostgreSQL
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
              Subsidiary:{" "}
              <span className="font-medium text-foreground">
                {pendingValues?.voucherInfo.subsidiary === "medibroker"
                  ? "Medibroker Ltd (Medi Broker)"
                  : "Chartered Brokers Ltd"}
              </span>
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
