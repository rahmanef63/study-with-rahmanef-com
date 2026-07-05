"use client";

// Login + Register tabs (Password provider). Lives in its own file so
// the page composition above it stays under the slice's ≤200-LOC budget.

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnonymousButton } from "./auth-buttons";
import { FieldEmail, FieldPassword, FieldText } from "./fields";
import type { useAuthFlow } from "../hooks";
import { looksLikeAutofillBug, validatePassword } from "../lib";
import type { AuthProvider, AuthResult, SignInLabels } from "../types";

interface PasswordFormsProps {
  flow: ReturnType<typeof useAuthFlow>;
  labels: SignInLabels;
  forgotPasswordHref: string | null;
  showAnonymous: boolean;
  onAnonymous: () => void | Promise<void>;
  onResult: (
    result: AuthResult,
    provider: AuthProvider,
  ) => void | Promise<void>;
}

export function PasswordForms({
  flow,
  labels,
  forgotPasswordHref,
  showAnonymous,
  onAnonymous,
  onResult,
}: PasswordFormsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (looksLikeAutofillBug(loginPassword)) {
      await onResult(
        { ok: false, error: labels.autofillEmailInPasswordError },
        "password",
      );
      return;
    }
    setIsPending(true);
    try {
      const result = await flow.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      await onResult(result, "password");
    } finally {
      setIsPending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (looksLikeAutofillBug(registerPassword)) {
      await onResult(
        { ok: false, error: labels.autofillEmailInPasswordError },
        "password",
      );
      return;
    }
    const pwdError = validatePassword(registerPassword);
    if (pwdError) {
      await onResult({ ok: false, error: pwdError }, "password");
      return;
    }
    setIsPending(true);
    try {
      const result = await flow.signUpWithPassword({
        email: registerEmail,
        password: registerPassword,
        name: registerName || undefined,
      });
      await onResult(result, "password");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{labels.loginTab}</TabsTrigger>
        <TabsTrigger value="register">{labels.registerTab}</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-3">
          <FieldEmail
            id="login-email"
            label={labels.emailLabel}
            placeholder={labels.emailPlaceholder}
            value={loginEmail}
            onChange={setLoginEmail}
            autoComplete="username"
          />
          <FieldPassword
            id="login-password"
            label={labels.passwordLabel}
            placeholder={labels.passwordPlaceholderLogin}
            value={loginPassword}
            onChange={setLoginPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            autoComplete="current-password"
          />
          {forgotPasswordHref ? (
            <div className="flex justify-end">
              <Link
                href={forgotPasswordHref}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {labels.forgotPassword}
              </Link>
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? labels.loginButtonLoading : labels.loginButton}
          </Button>
        </form>

        {showAnonymous ? (
          <div className="border-t pt-4 space-y-2 text-center">
            <p className="text-sm text-muted-foreground">{labels.anonymousTryHint}</p>
            <AnonymousButton
              flow={flow.signInAnonymous}
              labels={labels}
              onResult={async () => onAnonymous()}
              variant="outline"
              size="sm"
            />
            <p className="text-xs text-muted-foreground">{labels.anonymousHint}</p>
          </div>
        ) : null}
      </TabsContent>

      <TabsContent value="register">
        <form onSubmit={handleRegister} className="space-y-3">
          <FieldText
            id="register-name"
            label={labels.nameLabel}
            placeholder={labels.namePlaceholder}
            icon={<User className="h-4 w-4 text-muted-foreground" />}
            value={registerName}
            onChange={setRegisterName}
            autoComplete="name"
          />
          <FieldEmail
            id="register-email"
            label={labels.emailLabel}
            placeholder={labels.emailPlaceholder}
            value={registerEmail}
            onChange={setRegisterEmail}
            autoComplete="email"
          />
          <FieldPassword
            id="register-password"
            label={labels.passwordLabel}
            placeholder={labels.passwordPlaceholderRegister}
            value={registerPassword}
            onChange={setRegisterPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
            hint={labels.passwordHint}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? labels.registerButtonLoading : labels.registerButton}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}
