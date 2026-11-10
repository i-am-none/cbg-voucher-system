"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Files, FilePlus2, SearchX, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/vouchers/StatusBadge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
import { formatCurrency, formatDate } from "@/lib/format";
import type { Voucher, VoucherStatus } from "@/lib/types";
import { useVouchers } from "@/lib/voucher-store";

type StatusFilter = VoucherStatus | "all";
type SubsidiaryFilter = "all" | "chartered-brokers" | "medibroker";

function VoucherHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vouchers, isLoading } = useVouchers();
  
  const initialStatus = (searchParams.get("status") as StatusFilter) || "all";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState<SubsidiaryFilter>("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const statusParam = searchParams.get("status") as StatusFilter;
    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
    }
  }, [searchParams, statusFilter]);

  const filteredRows = useMemo(() => {
    return vouchers.filter((voucher) => {
      if (statusFilter !== "all" && voucher.status !== statusFilter) {
        return false;
      }
      if (dateFilter && voucher.date !== dateFilter) {
        return false;
      }
      if (subsidiaryFilter !== "all") {
        const sub = (voucher.subsidiary || "chartered-brokers").toLowerCase();
        if (subsidiaryFilter === "medibroker" && !sub.includes("medi")) {
          return false;
        }
        if (subsidiaryFilter === "chartered-brokers" && sub.includes("medi")) {
          return false;
        }
      }
      return true;
    });
  }, [vouchers, statusFilter, dateFilter, subsidiaryFilter]);

  const columns: DataTableColumn<Voucher>[] = [
    {
      key: "voucherNumber",
      header: "Voucher Number",
      sortable: true,
      sortValue: (row) => row.voucherNumber,
      cell: (row) => (
        <span className="font-semibold text-foreground">{row.voucherNumber}</span>
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
      key: "subsidiary",
      header: "Subsidiary",
      sortable: true,
      sortValue: (row) => row.subsidiary || "chartered-brokers",
      cell: (row) => {
        const isMedibroker =
          row.subsidiary === "medibroker" ||
          row.subsidiary?.toLowerCase().includes("medi");
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              isMedibroker
                ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            )}
          >
            {isMedibroker ? "Medi Broker" : "Chartered Brokers"}
          </span>
        );
      },
    },
    {
      key: "payee",
      header: "Payee",
      sortable: true,
      sortValue: (row) => row.payee.name,
      cell: (row) => <span className="font-medium">{row.payee.name}</span>,
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
      key: "createdBy",
      header: "Prepared By",
      sortable: true,
      sortValue: (row) => row.createdBy,
      cell: (row) => (
        <span className="text-muted-foreground">{row.createdBy}</span>
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

  return (
    <>
      <PageHeader
        icon={
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Files className="size-5" />
          </div>
        }
        title="Voucher History"
        description="Search, filter and review all payment vouchers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.info("Preparing Excel export...");
                window.location.href = "/api/vouchers/export";
              }}
              className="gap-1.5 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
              Export to Excel
            </Button>
            <Link
              href="/vouchers/new"
              className={buttonVariants({ size: "default" })}
            >
              <FilePlus2 className="size-4 mr-1.5" />
              Create Voucher
            </Link>
          </div>
        }
      />

      <div className="px-4 pb-10 pt-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>All Vouchers</CardTitle>
            <CardDescription>
              {filteredRows.length} of {vouchers.length} vouchers
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable<Voucher>
              columns={columns}
              rows={filteredRows}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              searchPlaceholder="Search by number, payee, invoice, description..."
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
              defaultPageSize={10}
              emptyState={
                <EmptyState
                  icon={SearchX}
                  title="No vouchers found"
                  description="Try adjusting your search or clearing the filters, or create a new voucher."
                  action={
                    <Link
                      href="/vouchers/new"
                      className={buttonVariants({ size: "sm" })}
                    >
                      <FilePlus2 className="size-4 mr-1.5" />
                      Create Voucher
                    </Link>
                  }
                />
              }
              toolbar={
                <>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="h-8 w-fit rounded-lg"
                    aria-label="Filter by date"
                  />
                  <Select
                    value={subsidiaryFilter}
                    onValueChange={(value) =>
                      setSubsidiaryFilter(value as SubsidiaryFilter)
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 w-44">
                      <SelectValue placeholder="All subsidiaries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subsidiaries</SelectItem>
                      <SelectItem value="chartered-brokers">Chartered Brokers Ltd</SelectItem>
                      <SelectItem value="medibroker">Medibroker Ltd (Medi Broker)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as StatusFilter)
                    }
                  >
                    <SelectTrigger size="sm" className="h-8 w-44">
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
                </>
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function VoucherHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading vouchers...</div>}>
      <VoucherHistoryContent />
    </Suspense>
  );
}