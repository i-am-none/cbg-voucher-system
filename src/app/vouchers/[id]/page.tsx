"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  PenLine,
  Printer,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/vouchers/StatusBadge";
import { SignatureBox } from "@/components/vouchers/SignatureBox";
import { VoucherSection } from "@/components/vouchers/VoucherSection";
import { VoucherTimeline } from "@/components/vouchers/VoucherTimeline";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_TYPE_META } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { VoucherStatus, type Voucher } from "@/lib/types";
import { useVouchers } from "@/lib/voucher-store";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

function InfoRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-0.5", className)}>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function VoucherDetails({
  voucher,
  onStatusUpdate,
}: {
  voucher: Voucher;
  onStatusUpdate: (status: VoucherStatus, note?: string) => Promise<void>;
}) {
  const { data: session } = useSession();
  const paymentTypeLabel = PAYMENT_TYPE_META[voucher.paymentType].label;
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const currentUserName = session?.user?.name || "A. Fernandes";
  const currentUserRole =
    ((session?.user as { role?: string })?.role || "maker").toLowerCase();

  // Maker-Checker Invariant: Maker cannot approve their own voucher
  const isCreatorOfVoucher =
    voucher.createdBy.toLowerCase() === currentUserName.toLowerCase() ||
    voucher.authorization.preparedBy.toLowerCase() === currentUserName.toLowerCase();

  const canApprove =
    (currentUserRole === "approver" || currentUserRole === "admin") &&
    !isCreatorOfVoucher;

  const handleStatus = async (status: VoucherStatus, note?: string) => {
    try {
      setIsUpdating(true);
      await onStatusUpdate(status, note);
      toast.success(`Voucher ${voucher.voucherNumber} status updated to ${status}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Action failed";
      toast.error(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting the voucher.");
      return;
    }
    setRejectDialogOpen(false);
    await handleStatus(VoucherStatus.REJECTED, rejectionReason);
    setRejectionReason("");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Voucher Number", "Date", "Status", "Payment Type", "Payee Name", "Amount", "Currency", "Invoice Number", "Description", "Prepared By", "Approval To Pay"],
      [
        voucher.voucherNumber,
        voucher.date,
        voucher.status,
        voucher.paymentType,
        `"${voucher.payee.name}"`,
        voucher.payment.amount,
        voucher.payment.currency,
        voucher.payment.invoiceNumber,
        `"${voucher.payment.description.replace(/"/g, '""')}"`,
        `"${voucher.authorization.preparedBy}"`,
        `"${voucher.authorization.approvalToPay}"`,
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${voucher.voucherNumber}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${voucher.voucherNumber} as CSV`);
  };

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          icon={
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-5" />
            </div>
          }
          title={voucher.voucherNumber}
          description={`${formatDate(voucher.date)} • ${paymentTypeLabel}`}
          actions={
            <>
              <StatusBadge status={voucher.status} className="self-center" />
              <Link
                href="/vouchers"
                className={buttonVariants({ variant: "outline", size: "default" })}
              >
                <ArrowLeft className="size-4 mr-1.5" />
                Back to History
              </Link>
              {voucher.status === VoucherStatus.PENDING_APPROVAL && (
                <>
                  {canApprove ? (
                    <Button
                      type="button"
                      disabled={isUpdating}
                      variant="default"
                      size="default"
                      onClick={() =>
                        handleStatus(
                          VoucherStatus.APPROVED,
                          `Approved by ${currentUserName}`
                        )
                      }
                    >
                      <CheckCircle className="size-4 mr-1.5" />
                      Approve Voucher
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled
                      variant="secondary"
                      size="default"
                      title={
                        isCreatorOfVoucher
                          ? "Maker-Checker rule: Maker cannot self-approve."
                          : "Approver role required."
                      }
                    >
                      <ShieldAlert className="size-4 mr-1.5 text-amber-500" />
                      Approve (Restricted)
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={isUpdating}
                    variant="destructive"
                    size="default"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="size-4 mr-1.5" />
                    Reject
                  </Button>
                </>
              )}
              {voucher.status === VoucherStatus.APPROVED && (
                <Button
                  type="button"
                  disabled={isUpdating}
                  variant="default"
                  size="default"
                  onClick={() =>
                    handleStatus(
                      VoucherStatus.PAID,
                      `Payment disbursed by ${currentUserName}`
                    )
                  }
                >
                  <CheckCircle className="size-4 mr-1.5" />
                  Mark as Paid
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="size-4 mr-1.5" />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handlePrint}
              >
                <Printer className="size-4 mr-1.5" />
                Print Voucher
              </Button>
            </>
          }
        />
      </div>

      {/* Maker-Checker Alert Banner if user is creator viewing pending voucher */}
      {voucher.status === VoucherStatus.PENDING_APPROVAL && isCreatorOfVoucher && (
        <div className="mx-4 mt-4 lg:mx-8 print:hidden">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm">
              <p className="font-medium">Maker / Approver Separation Enforced</p>
              <p className="text-xs opacity-90">
                You prepared this voucher. In accordance with CBG financial controls, another authorized approver must review and sign off.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Printable Physical 3-Copy Voucher Layout & Digital Display */}
      <div className="space-y-5 px-4 pb-12 pt-6 lg:px-8 print:p-0 print:m-0">
        <div className="hidden print:block mb-6 border-b pb-4 text-center">
          <h1 className="text-xl font-bold uppercase tracking-wider">
            CHARTERED BROKERS GROUP (CBG)
          </h1>
          <p className="text-sm font-semibold">PAYMENT VOUCHER</p>
          <p className="text-xs text-muted-foreground">Port Louis, Mauritius</p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3 print:grid-cols-1 print:gap-4">
          <div className="space-y-5 xl:col-span-2 print:col-span-1 print:space-y-4">
            <VoucherSection
              title="Voucher Information"
              description="Serial number, date and payment method"
              icon={FileText}
              contentClassName="grid gap-5 sm:grid-cols-2 print:grid-cols-2"
            >
              <InfoRow label="Voucher Number">
                <span className="font-bold text-foreground text-base">
                  {voucher.voucherNumber}
                </span>
              </InfoRow>
              <InfoRow label="Date">{formatDate(voucher.date)}</InfoRow>
              <InfoRow label="Payment Type">{paymentTypeLabel}</InfoRow>
              <InfoRow label="Status">
                <StatusBadge status={voucher.status} />
              </InfoRow>
            </VoucherSection>

            <VoucherSection
              title="Payee Information"
              description="Details of the party receiving the payment"
              icon={UserRound}
              contentClassName="grid gap-5 sm:grid-cols-2 print:grid-cols-2"
            >
              <InfoRow label="Payee Name">
                <span className="font-semibold">{voucher.payee.name}</span>
              </InfoRow>
              <InfoRow label="Phone Number">{voucher.payee.phone}</InfoRow>
              <InfoRow label="Address" className="sm:col-span-2 print:col-span-2">
                {voucher.payee.address}
              </InfoRow>
              <InfoRow label="Bank Name">{voucher.payee.bankName}</InfoRow>
              <InfoRow label="Bank Account Number">
                {voucher.payee.bankAccount}
              </InfoRow>
            </VoucherSection>

            <VoucherSection
              title="Payment Details"
              description="What is being paid and the total amount"
              icon={Building2}
              contentClassName="grid gap-5 sm:grid-cols-2 print:grid-cols-2"
            >
              <InfoRow label="Payment Description" className="sm:col-span-2 print:col-span-2">
                {voucher.payment.description}
              </InfoRow>
              <InfoRow label="Invoice Number">
                {voucher.payment.invoiceNumber}
              </InfoRow>
              <InfoRow label="Total Amount (Rs.)">
                <span className="font-bold text-lg tabular-nums text-primary">
                  {formatCurrency(
                    voucher.payment.amount,
                    voucher.payment.currency
                  )}
                </span>
              </InfoRow>
              <InfoRow label="Cheque Number">
                {voucher.banking.chequeNumber || "—"}
              </InfoRow>
              <InfoRow label="Bank Number">
                {voucher.banking.bankNumber || "—"}
              </InfoRow>
            </VoucherSection>

            <VoucherSection
              title="Authorization & Signatures"
              description="Sign-offs for Maker, Approver, and Payee Receiver"
              icon={PenLine}
              contentClassName="grid gap-5 sm:grid-cols-2 print:grid-cols-2"
            >
              <InfoRow label="Prepared By (Maker)">
                {voucher.authorization.preparedBy}
              </InfoRow>
              <InfoRow label="Approval To Pay (Approver)">
                {voucher.authorization.approvalToPay}
              </InfoRow>
              <InfoRow label="Name Of Receiver" className="sm:col-span-2 print:col-span-2">
                {voucher.authorization.receiverName}
              </InfoRow>
              <div className="grid gap-3 sm:col-span-2 sm:grid-cols-3 print:grid-cols-3">
                <SignatureBox
                  label="Prepared By Signature"
                  name={voucher.authorization.preparedBy}
                  signed={voucher.authorization.signatures.preparedBy}
                />
                <SignatureBox
                  label="Approver Signature"
                  name={voucher.authorization.approvalToPay}
                  signed={voucher.authorization.signatures.approver}
                />
                <SignatureBox
                  label="Receiver Signature"
                  name={voucher.authorization.receiverName}
                  signed={voucher.authorization.signatures.receiver}
                />
              </div>
            </VoucherSection>
          </div>

          <div className="space-y-5 print:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  Voucher Timeline
                </CardTitle>
                <CardDescription>
                  Workflow progression in PostgreSQL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VoucherTimeline events={voucher.timeline} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  Audit Trail
                </CardTitle>
                <CardDescription>
                  Immutable append-only audit log
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {voucher.auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.actor}
                        {entry.note ? ` • ${entry.note}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Voucher {voucher.voucherNumber}</DialogTitle>
            <DialogDescription>
              Please enter the reason for returning this payment voucher. The reason will be recorded in the immutable audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="e.g. Incorrect invoice total attached; please verify VAT amount."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function VoucherDetailsPage() {
  const params = useParams<{ id: string }>();
  const { getVoucher, isLoading, updateVoucherStatus } = useVouchers();

  const voucher = getVoucher(params.id);

  if (isLoading) {
    return (
      <div className="space-y-5 px-4 pb-12 pt-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-5 xl:grid-cols-3">
          <Skeleton className="h-96 rounded-xl xl:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="px-4 pb-12 pt-6 lg:px-8">
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={FileText}
              title="Voucher not found"
              description="The voucher you are looking for does not exist or may have been deleted."
              action={
                <Link
                  href="/vouchers"
                  className={buttonVariants({ size: "sm" })}
                >
                  <ArrowLeft className="size-4 mr-1.5" />
                  Back to History
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <VoucherDetails
      voucher={voucher}
      onStatusUpdate={async (status, note) => {
        await updateVoucherStatus(voucher.id, status, note);
      }}
    />
  );
}