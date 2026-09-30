import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  FileText,
  Send,
  type LucideIcon,
} from "lucide-react";

import { formatDateTime } from "@/lib/format";
import {
  TimelineEventType,
  type TimelineEvent as TimelineEventTypeModel,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const EVENT_META: Record<
  TimelineEventTypeModel["type"],
  { icon: LucideIcon; className: string }
> = {
  [TimelineEventType.CREATED]: {
    icon: FileText,
    className: "bg-muted text-muted-foreground",
  },
  [TimelineEventType.SUBMITTED]: {
    icon: Send,
    className: "bg-amber-500/10 text-amber-600",
  },
  [TimelineEventType.APPROVED]: {
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600",
  },
  [TimelineEventType.REJECTED]: {
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
  [TimelineEventType.PAID]: {
    icon: Banknote,
    className: "bg-primary/10 text-primary",
  },
};

interface VoucherTimelineProps {
  events: TimelineEventTypeModel[];
}

export function VoucherTimeline({ events }: VoucherTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <ol className="relative space-y-0">
      {sorted.map((event, index) => {
        const meta = EVENT_META[event.type];
        const isLast = index === sorted.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className="absolute left-[13px] top-8 bottom-0 w-px bg-border"
              />
            ) : null}
            <div
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                meta.className
              )}
            >
              <meta.icon className="size-3.5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium text-foreground">{event.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event.actor ? `${event.actor} • ` : ""}
                {formatDateTime(event.timestamp)}
              </p>
              {event.note ? (
                <p className="mt-1 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                  {event.note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}