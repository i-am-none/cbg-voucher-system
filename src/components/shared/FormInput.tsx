import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormInputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  hintClassName?: string;
}

export function FormInput({
  label,
  error,
  hint,
  required,
  id,
  hintClassName,
  className,
  ...props
}: FormInputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={inputId}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(className)}
        {...props}
      />
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={cn("text-xs text-muted-foreground", hintClassName)}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}