"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarPlus,
  Building2,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  Play,
  RotateCcw,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ScheduledVoucher } from "@/lib/types";
import {
  getScheduledVouchersAction,
  generateVoucherFromScheduleAction,
  cancelScheduledVoucherAction,
} from "@/server/scheduled-vouchers";

function getDaysRemaining(scheduledDateStr: string): {
  days: number;
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  const target = new Date(scheduledDateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, label: "Due Today", isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { days: 1, label: "Due Tomorrow", isOverdue: false, isToday: false };
  } else if (diffDays > 1) {
    return {
      days: diffDays,
      label: `In ${diffDays} days`,
      isOverdue: false,
      isToday: false,
    };
  } else {
    return {
      days: diffDays,
      label: `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} past due`,
      isOverdue: true,
      isToday: false,
    };
  }
}

interface ScheduledVouchersClientProps {
  initialSchedules: ScheduledVoucher[];
}

export function ScheduledVouchersClient({
  initialSchedules,
}: ScheduledVouchersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [schedules, setSchedules] = useState<ScheduledVoucher[]>(initialSchedules);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subsidiaryFilter, setSubsidiaryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state if server passes updated initialSchedules
  useEffect(() => {
    setSchedules(initialSchedules);
  }, [initialSchedules]);

  // Load latest data from server
  const loadSchedules = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const data = await getScheduledVouchersAction();
      setSchedules(data);
      if (showToast) {
        toast.success("Synchronized with Neon database");
      }
    } catch (err: any) {
      if (showToast) {
        toast.error("Failed to refresh scheduled vouchers", {
          description: err?.message,
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Re-fetch whenever user returns to this page or focuses window
  useEffect(() => {
    loadSchedules();

    const onFocus = () => loadSchedules();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [pathname, loadSchedules]);

  const handleGenerateNow = async (schedule: ScheduledVoucher) => {
    setExecutingId(schedule.id);
    try {
      const res = await generateVoucherFromScheduleAction(schedule.id);
      if (res.success && res.voucherId) {
        toast.success(`Voucher ${res.voucherNumber || ""} generated!`, {
          description: "Live voucher has been created and saved in Neon PostgreSQL.",
          action: {
            label: "View Voucher",
            onClick: () => router.push(`/vouchers/${res.voucherId}`),
          },
        });
        await loadSchedules();
        router.refresh();
      } else {
        toast.error("Failed to generate voucher", {
          description: res.error,
        });
      }
    } catch (err: any) {
      toast.error("Execution failed", { description: err?.message });
    } finally {
      setExecutingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled voucher?")) return;
    try {
      const res = await cancelScheduledVoucherAction(id);
      if (res.success) {
        toast.info("Scheduled voucher marked as cancelled.");
        await loadSchedules();
        router.refresh();
      } else {
        toast.error("Could not cancel schedule", { description: res.error });
      }
    } catch (err: any) {
      toast.error("Cancellation error", { description: err?.message });
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = schedules.length;
    const upcoming = schedules.filter((s) => s.status === "scheduled").length;
    const generated = schedules.filter((s) => s.status === "generated").length;
    const dueSoon = schedules.filter((s) => {
      if (s.status !== "scheduled") return false;
      const { days } = getDaysRemaining(s.scheduledDate);
      return days >= 0 && days <= 7;
    }).length;
    return { total, upcoming, generated, dueSoon };
  }, [schedules]);

  // Filtered rows
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (subsidiaryFilter !== "all" && item.subsidiary !== subsidiaryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchPayee = item.payee.name.toLowerCase().includes(q);
        const matchDesc = item.payment.description.toLowerCase().includes(q);
        const matchInv = item.payment.invoiceNumber?.toLowerCase().includes(q);
        const matchMaker = item.authorization.preparedBy.toLowerCase().includes(q);
        if (!matchPayee && !matchDesc && !matchInv && !matchMaker) return false;
      }
      return true;
    });
  }, [schedules, statusFilter, subsidiaryFilter, searchQuery]);

  return (
    <>
      <PageHeader
        icon={
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarClock className="size-5" />
          </div>
        }
        title="Scheduled Vouchers"
        description="Upcoming payment vouchers pre-filled by makers for generation on designated dates (Neon PostgreSQL integrated)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                loadSchedules(true);
                router.refresh();
              }}
              disabled={isRefreshing}
              className="gap-2"
              title="Refresh scheduled vouchers from Neon database"
            >
              <RotateCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link
              href="/vouchers/scheduled/new"
              className={buttonVariants({ variant: "default", size: "default" })}
            >
              <CalendarPlus className="size-4" />
              Schedule New Voucher
            </Link>
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Upcoming Schedules
                </p>
                <p className="text-2xl font-bold mt-1 text-primary">{metrics.upcoming}</p>
              </div>
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due Within 7 Days
                </p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{metrics.dueSoon}</p>
              </div>
              <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                <AlertCircle className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Live Generated
                </p>
                <p className="text-2xl font-bold mt-1 text-emerald-600">{metrics.generated}</p>
              </div>
              <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Managed
                </p>
                <p className="text-2xl font-bold mt-1 text-foreground">{metrics.total}</p>
              </div>
              <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <CalendarClock className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border/60 mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by creditor, description, invoice, maker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val || "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="scheduled">Upcoming (Scheduled)</SelectItem>
                  <SelectItem value="generated">Generated (Live)</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subsidiary Filter */}
            <div>
              <Select
                value={subsidiaryFilter}
                onValueChange={(val) => setSubsidiaryFilter(val || "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subsidiary: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Subsidiary: All</SelectItem>
                  <SelectItem value="chartered-brokers">Chartered Brokers Ltd</SelectItem>
                  <SelectItem value="medibroker">Medibroker Ltd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Items List */}
      <div className="space-y-4">
        {filteredSchedules.length === 0 ? (
          <Card className="border-dashed p-12 text-center">
            <CalendarClock className="size-10 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No scheduled vouchers found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              There are currently no upcoming vouchers matching the selected filters.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadSchedules(true)}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RotateCcw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh List
              </Button>
              <Link
                href="/vouchers/scheduled/new"
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <CalendarPlus className="size-4" />
                Schedule a Voucher
              </Link>
            </div>
          </Card>
        ) : (
          filteredSchedules.map((item) => {
            const { label, isOverdue, isToday } = getDaysRemaining(item.scheduledDate);
            const isChartered = item.subsidiary === "chartered-brokers";

            return (
              <Card
                key={item.id}
                className="border-border/60 hover:border-border transition-all shadow-xs"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Schedule Date & Badges */}
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Target Date Badge */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-semibold">
                          <CalendarClock className="size-3.5 text-primary" />
                          <span>Target: {formatDate(item.scheduledDate)}</span>
                        </div>

                        {/* Status / Countdown */}
                        {item.status === "scheduled" && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                              isToday
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : isOverdue
                                ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <Clock className="size-3.5" />
                            {label}
                          </span>
                        )}

                        {item.status === "generated" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="size-3.5" />
                            Generated ({item.generatedVoucherNumber})
                          </span>
                        )}

                        {item.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground">
                            <XCircle className="size-3.5" />
                            Cancelled
                          </span>
                        )}

                        {/* Subsidiary Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
                            isChartered
                              ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          {isChartered ? (
                            <Building2 className="size-3" />
                          ) : (
                            <Building className="size-3" />
                          )}
                          {isChartered ? "Chartered Brokers" : "Medibroker"}
                        </span>
                      </div>

                      {/* Creditor & Particulars */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          {item.payee.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                          {item.payment.description}
                        </p>
                      </div>

                      {/* Banking & Maker Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                        <span>
                          <strong className="text-foreground">Credited from:</strong>{" "}
                          {item.banking.bankNumber || "Subsidiary Corporate Account"}
                        </span>
                        {item.payee.bankAccount && (
                          <span>
                            <strong className="text-foreground">Payee A/C:</strong>{" "}
                            {item.payee.bankName} - {item.payee.bankAccount}
                          </span>
                        )}
                        <span>
                          <strong className="text-foreground">Maker:</strong>{" "}
                          {item.authorization.preparedBy}
                        </span>
                        <span>
                          <strong className="text-foreground">Approver:</strong>{" "}
                          {item.authorization.approvalToPay}
                        </span>
                      </div>
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="flex flex-col lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/40">
                      <div>
                        <p className="text-xs text-muted-foreground lg:text-right uppercase tracking-wider">
                          Amount
                        </p>
                        <p className="text-xl font-bold font-mono text-foreground lg:text-right">
                          {formatCurrency(item.payment.amount, item.payment.currency)}
                        </p>
                        {item.payment.invoiceNumber && (
                          <p className="text-xs text-muted-foreground lg:text-right">
                            Inv: {item.payment.invoiceNumber}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {item.status === "scheduled" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => handleCancel(item.id)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="text-xs gap-1.5 shadow-xs"
                              disabled={executingId === item.id}
                              onClick={() => handleGenerateNow(item)}
                            >
                              <Play className="size-3.5 fill-current" />
                              {executingId === item.id
                                ? "Generating..."
                                : "Generate Live Voucher Now"}
                            </Button>
                          </>
                        )}

                        {item.status === "generated" && item.generatedVoucherId && (
                          <Link
                            href={`/vouchers/${item.generatedVoucherId}`}
                            className={buttonVariants({
                              variant: "outline",
                              size: "sm",
                              className: "text-xs gap-1.5",
                            })}
                          >
                            <ExternalLink className="size-3.5" />
                            View Live Voucher
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
