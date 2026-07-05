"use client";

// Form-field primitives used by the sign-in page. Kept here (not in
// `@/components/ui/*`) because they bake in icon + label layout we
// don't want pushed into the design system — they're slice-private.

import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FieldTextProps {
  id: string;
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
}

export function FieldText({
  id,
  label,
  placeholder,
  icon,
  value,
  onChange,
  autoComplete,
}: FieldTextProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        ) : null}
        <Input
          id={id}
          name={id}
          type="text"
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={icon ? "pl-10" : undefined}
          required
        />
      </div>
    </div>
  );
}

export interface FieldEmailProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
}

export function FieldEmail({
  id,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
}: FieldEmailProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
          required
        />
      </div>
    </div>
  );
}

export interface FieldPasswordProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  hint?: string;
}

export function FieldPassword({
  id,
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  hint,
}: FieldPasswordProps) {
  const isNew = autoComplete === "new-password";
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          name={isNew ? "new-password" : "current-password"}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-10"
          minLength={isNew ? 8 : undefined}
          maxLength={isNew ? 128 : undefined}
          required
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 h-auto w-auto -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
