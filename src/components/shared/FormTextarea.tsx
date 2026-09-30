import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormTextareaProps
  extends React.ComponentProps<"textarea"> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function FormTextarea({
  label,
  error,
  hint,
  required,
  id,
  className,
  ...props
}: FormTextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={textareaId}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Textarea
        id={textareaId}
        aria-invalid={Boolean(error)}
        className={cn(className)}
        {...props}
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}