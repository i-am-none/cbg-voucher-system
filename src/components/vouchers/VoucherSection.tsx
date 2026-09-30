import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VoucherSectionProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function VoucherSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
}: VoucherSectionProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center gap-2.5">
          {Icon ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
          ) : null}
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn("grid gap-4 pt-4 sm:grid-cols-2", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  );
}