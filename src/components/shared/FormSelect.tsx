"use client";

import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Select...",
  error,
  hint,
  required,
  disabled,
}: FormSelectProps<T>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            name={name}
            disabled={disabled}
            aria-invalid={Boolean(error)}
          >
            <SelectTrigger
              id={name}
              className="w-full justify-between data-placeholder:text-muted-foreground"
              aria-invalid={Boolean(error)}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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