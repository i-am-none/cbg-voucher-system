import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface DashboardCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
  className?: string;
  index?: number;
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
  className,
  index = 0,
}: DashboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06, ease: "easeOut" }}
      className={cn("min-w-0", className)}
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
              iconClassName
            )}
          >
            <Icon className="size-4.5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </div>
          {description ? (
            <CardDescription className="mt-1">{description}</CardDescription>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}