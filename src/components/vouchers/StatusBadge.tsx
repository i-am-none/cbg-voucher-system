import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/constants";
import type { VoucherStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: VoucherStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <Badge
      variant={meta.badgeVariant}
      className={cn("h-5.5 gap-1.5 rounded-full px-2 py-0.5", className)}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", meta.dotClassName)} />
      <span className="capitalize">{meta.label}</span>
    </Badge>
  );
}