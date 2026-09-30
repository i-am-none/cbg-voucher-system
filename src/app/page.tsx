"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Send,
} from "lucide-react";

import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/vouchers/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
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
import { STATUS_OPTIONS } from "@/lib/constants";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";
import type { Voucher, VoucherStatus } from "@/lib/types";
import { useVouchers } from "@/lib/voucher-store";

type StatusFilter = VoucherStatus | "all";

export default function DashboardPage() {
  const router = useRouter();
  const { vouchers, isLoading } = useVouchers();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const recentVouchers = useMemo(
    () => vouchers.slice(0, 8),
    [vouchers]
  );

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return recentVouchers;
    return recentVouchers.filter(
      (voucher) => voucher.status === statusFilter
    );
  }, [recentVouchers, statusFilter]);

  const columns: DataTableColumn<Voucher>[] = [
    {
      key: "voucherNumber",
      header: "Voucher Number",
      sortable: true,
      sortValue: (row) => row.voucherNumber,
      cell: (row) => (
        <span className="font-medium text-foreground">{row.voucherNumber}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortValue: (row) => row.date,
      cell: (row) => formatDate(row.date),
    },
    {
      key: "payee",
      header: "Payee",
      sortable: true,
      sortValue: (row) => row.payee.name,
      cell: (row) => <span className="font-medium">{row.payee.name}</span>,
    },
    {
      key: "description",
      header: "Payment Description",
      cell: (row) => (
        <span className="block max-w-72 truncate text-muted-foreground">
          {row.payment.description}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      sortValue: (row) => row.payment.amount,
      cell: (row) => (
        <span className="font-medium tabular-nums">
          {formatCurrency(row.payment.amount, row.payment.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const metrics = useMemo(() => {
    const totalVouchers = vouchers.length;
    const pendingApproval = vouchers.filter(
      (v) => v.status === "pending-approval"
    ).length;
    const approvedPayments = vouchers.filter(
      (v) => v.status === "approved" || v.status === "paid"
    ).length;
    const totalPaymentAmount = vouchers.reduce(
      (acc, v) => acc + (v.payment.amount || 0),
      0
    );

    return {
      totalVouchers,
      pendingApproval,
      approvedPayments,
      totalPaymentAmount,
    };
  }, [vouchers]);

  const cards = [
    {
      title: "Total Vouchers",
      value: String(metrics.totalVouchers),
      description: "All payment vouchers created",
      icon: FileText,
    },
    {
      title: "Pending Approval",
      value: String(metrics.pendingApproval),
      description: "Awaiting approver sign-off",
      icon: Send,
    },
    {
      title: "Approved / Paid",
      value: String(metrics.approvedPayments),
      description: "Approved and queued for payment",
      icon: CheckCircle2,
    },
    {
      title: "Total Amount",
      value: `Rs ${metrics.totalPaymentAmount.toLocaleString("en-IN")}`,
      description: `Outlay across ${formatCompactCurrency(metrics.totalPaymentAmount)}`,
      icon: Banknote,
    },
  ];

  return (
    <>
      <PageHeader
        icon={
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </div>
        }
        title="Digital Payment Voucher System"
        description="Monitor voucher activity, approvals and payments at a glance."
        actions={
          <Link
            href="/vouchers/new"
            className={buttonVariants({ size: "default" })}
          >
            <FilePlus2 />
            Create Voucher
          </Link>
        }
      />

      <div className="grid gap-4 px-4 pt-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {cards.map((card, index) => (
          <DashboardCard
            key={card.title}
            index={index}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="px-4 pb-10 pt-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Vouchers</CardTitle>
            <CardDescription>
              Latest voucher records across all statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable<Voucher>
              columns={columns}
              rows={filteredRows}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              searchPlaceholder="Search vouchers..."
              searchableText={(row) =>
                [
                  row.voucherNumber,
                  row.payee.name,
                  row.payment.description,
                  row.payment.invoiceNumber,
                  row.createdBy,
                ].join(" ")
              }
              onRowClick={(row) => router.push(`/vouchers/${row.id}`)}
              defaultPageSize={8}
              toolbar={
                <>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as StatusFilter)
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 w-40">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Link
                    href="/vouchers"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View All
                    <ArrowRight />
                  </Link>
                </>
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}