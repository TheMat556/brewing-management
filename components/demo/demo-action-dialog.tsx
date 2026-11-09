"use client";

import { CheckCircle2, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DemoField =
  | {
      kind: "text" | "number" | "date" | "datetime-local" | "email" | "textarea";
      name: string;
      label: string;
      placeholder?: string;
      required?: boolean;
      min?: number;
      step?: string;
      defaultValue?: string;
      hint?: string;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      placeholder?: string;
      required?: boolean;
      defaultValue?: string;
      hint?: string;
    };

type DemoActionButtonProps = {
  label: string;
  title: string;
  description: string;
  submitLabel: string;
  fields: DemoField[];
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  successMessage?: string;
  onSubmit?: (values: Record<string, string>) => void;
};

function defaultValues(fields: DemoField[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""]));
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: DemoField;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.kind === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`demo-${field.name}`} className="w-full">
          <SelectValue placeholder={field.placeholder ?? "Auswählen"} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.kind === "textarea") {
    return (
      <textarea
        id={`demo-${field.name}`}
        className={cn(
          "min-h-20 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow]",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "dark:bg-input/30",
        )}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <Input
      id={`demo-${field.name}`}
      name={field.name}
      type={field.kind}
      placeholder={field.placeholder}
      required={field.required}
      min={field.min}
      step={field.step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function DemoDialogShell({
  open,
  title,
  description,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Dialog schließen"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl border bg-background p-4 shadow-2xl sm:p-6",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Schließen"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function DemoActionButton({
  label,
  title,
  description,
  submitLabel,
  fields,
  icon,
  variant = "default",
  size = "default",
  className,
  successMessage,
  onSubmit,
}: DemoActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => defaultValues(fields));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setValues(defaultValues(fields));
    setSubmitted(false);
    setError(null);
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = fields.find(
      (field) => field.required && (values[field.name] ?? "").trim() === "",
    );
    if (missing) {
      setError(`${missing.label} ist erforderlich.`);
      return;
    }
    setError(null);
    onSubmit?.(values);
    setSubmitted(true);
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={openDialog}
      >
        {icon}
        {label}
      </Button>
      <DemoDialogShell open={open} title={title} description={description} onClose={closeDialog}>
        {submitted ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{successMessage ?? "Demo-Eingabe übernommen."}</p>
                <p className="mt-1 opacity-80">
                  Es wurde nichts an Supabase gesendet. Die echte Speicherung folgt später.
                </p>
              </div>
            </div>
            {fields.length > 0 ? (
              <dl className="grid gap-2 rounded-lg border p-4 text-sm">
                {fields.map((field) => {
                  const raw = values[field.name] ?? "";
                  const display =
                    field.kind === "select"
                      ? (field.options.find((option) => option.value === raw)?.label ?? raw)
                      : raw;
                  return (
                    <div key={field.name} className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
                      <dt className="text-muted-foreground">{field.label}</dt>
                      <dd className="break-words font-medium">{display || "—"}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Schließen
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setValues(defaultValues(fields));
                  setSubmitted(false);
                }}
              >
                Weitere Eingabe
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={`demo-${field.name}`}>{field.label}</Label>
                <FieldControl
                  field={field}
                  value={values[field.name] ?? ""}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, [field.name]: value }))
                  }
                />
                {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
              </div>
            ))}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Abbrechen
              </Button>
              <Button type="submit" variant={variant === "destructive" ? "destructive" : "default"}>
                {submitLabel}
              </Button>
            </div>
          </form>
        )}
      </DemoDialogShell>
    </>
  );
}
