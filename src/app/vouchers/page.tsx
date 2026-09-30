"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Files, FilePlus2, SearchX } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/vouchers/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function VoucherHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vouchers, isLoading } = useVouchers();
  
  const initialStatus = (searchParams.get("status") as StatusFilter) || "all";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
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
      return true;
    });
  }, [vouchers, statusFilter, dateFilter]);

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
          <Link
            href="/vouchers/new"
            className={buttonVariants({ size: "default" })}
          >
            <FilePlus2 className="size-4 mr-1.5" />
            Create Voucher
          </Link>
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