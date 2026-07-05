"use client";

// Presentational blocks composed by <AuthCard>. Callback-driven (no
// Convex import) so they work in previews/modals with mock handlers and
// in real apps wired to `useAuthFlow`. Kept in their own file so AuthCard
// stays under the slice's ≤200-LOC budget.

import { useState } from "react";
import Link from "next/link";
import { Phone, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import { FieldEmail, FieldPassword, FieldText } from "./fields";
import type { AuthResult, PasswordCredentials, SignInLabels } from "../types";

export type PasswordMode = "signin" | "signup";
export type PasswordSubmit = (
  creds: PasswordCredentials & { name?: string; mode: PasswordMode },
) => Promise<AuthResult>;

export function Divider({ text }: { text: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}

export function GithubButton({
  flow, onResult, label = "Continue with GitHub", loadingLabel = "Redirecting to GitHub…",
}: {
  flow: () => Promise<AuthResult>;
  onResult: (r: AuthResult) => void | Promise<void>;
  label?: string;
  loadingLabel?: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button" variant="outline" className="w-full" disabled={pending}
      onClick={async () => {
        setPending(true);
        try { await onResult(await flow()); } finally { setPending(false); }
      }}
    >
      <GithubLogo />
      {pending ? loadingLabel : label}
    </Button>
  );
}

function GithubLogo() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.2c-3.34.72-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5.99.1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

export function PasswordBlock({
  labels, forgotPasswordHref, onSubmit, onResult, defaultMode = "signin",
}: {
  labels: SignInLabels;
  forgotPasswordHref: string | null;
  onSubmit: PasswordSubmit;
  onResult: (r: AuthResult) => void | Promise<void>;
  defaultMode?: PasswordMode;
}) {
  const [mode, setMode] = useState<PasswordMode>(defaultMode);
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await onResult(await onSubmit({ email, password, name: name || undefined, mode }));
    } finally { setPending(false); }
  };

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as PasswordMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">{labels.loginTab}</TabsTrigger>
        <TabsTrigger value="signup">{labels.registerTab}</TabsTrigger>
      </TabsList>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {isSignup ? (
          <FieldText id="auth-name" label={labels.nameLabel} placeholder={labels.namePlaceholder}
            icon={<User className="h-4 w-4 text-muted-foreground" />} value={name} onChange={setName} autoComplete="name" />
        ) : null}
        <FieldEmail id="auth-email" label={labels.emailLabel} placeholder={labels.emailPlaceholder}
          value={email} onChange={setEmail} autoComplete={isSignup ? "email" : "username"} />
        <FieldPassword id="auth-password" label={labels.passwordLabel}
          placeholder={isSignup ? labels.passwordPlaceholderRegister : labels.passwordPlaceholderLogin}
          value={password} onChange={setPassword} show={show} onToggleShow={() => setShow((v) => !v)}
          autoComplete={isSignup ? "new-password" : "current-password"} hint={isSignup ? labels.passwordHint : undefined} />
        {!isSignup && forgotPasswordHref ? (
          <div className="flex justify-end">
            <Link href={forgotPasswordHref} className="text-sm text-muted-foreground hover:text-foreground">
              {labels.forgotPassword}
            </Link>
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? (isSignup ? labels.registerButtonLoading : labels.loginButtonLoading)
            : (isSignup ? labels.registerButton : labels.loginButton)}
        </Button>
      </form>
    </Tabs>
  );
}

export function PhoneForm({
  onSend, onVerify, onResult,
}: {
  onSend: (phone: string) => Promise<AuthResult>;
  onVerify: (phone: string, code: string) => Promise<AuthResult>;
  onResult: (r: AuthResult) => void | Promise<void>;
}) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const r = await onSend(phone);
      if (r.ok) setStep("otp"); else await onResult(r);
    } finally { setPending(false); }
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try { await onResult(await onVerify(phone, code)); } finally { setPending(false); }
  };

  if (step === "phone") {
    return (
      <form onSubmit={send} className="space-y-2">
        <div className="space-y-2">
          <Label htmlFor="auth-phone">Phone number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="auth-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel"
              placeholder="+62 812 3456 7890" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="pl-10" required />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending…" : "Send code"}</Button>
        <p className="text-xs text-muted-foreground">We&apos;ll text you a 6-digit verification code.</p>
      </form>
    );
  }
  return (
    <form onSubmit={verify} className="space-y-3 text-center">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code sent to <span className="font-mono">{phone || "your phone"}</span>.
      </p>
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="submit" className="w-full" disabled={pending || code.length < 6}>
        {pending ? "Verifying…" : "Verify"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setStep("phone")}>Use a different number</Button>
    </form>
  );
}
