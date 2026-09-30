import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureBoxProps {
  label: string;
  name?: string;
  signed?: boolean;
  placeholder?: string;
  className?: string;
}

export function SignatureBox({
  label,
  name,
  signed = false,
  placeholder = "Signature",
  className,
}: SignatureBoxProps) {
  return (
    <div
      className={cn(
        "flex h-24 flex-col justify-between rounded-lg border border-dashed p-3",
        signed ? "border-primary/40 bg-primary/5" : "border-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <PenLine className="size-3.5 text-muted-foreground" />
      </div>
      {name ? (
        <p className="text-sm font-medium italic text-foreground">{name}</p>
      ) : (
        <p className="text-sm text-muted-foreground/70">{placeholder}</p>
      )}
      <div
        className={cn(
          "h-px w-full",
          signed ? "bg-primary/40" : "bg-muted-foreground/30"
        )}
      />
      {signed ? (
        <p className="text-[11px] text-muted-foreground">Signed</p>
      ) : (
        <p className="text-[11px] text-muted-foreground/60">Awaiting signature</p>
      )}
    </div>
  );
}