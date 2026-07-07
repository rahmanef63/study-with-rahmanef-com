"use client";

// Presentational settings form — props-driven (no hardcoded copy/URLs), all
// side effects arrive via onSubmit/onCheckUsername so the form stays portable.
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_PROFILE_LABELS } from "../config/labels";
import type { ProfileFormValues, ProfileLabels, UsernameCheck } from "../types";
import { ProfileAvatar } from "./profile-avatar";
import { Textarea } from "./textarea";

export type ProfileSettingsFormProps = {
  initial: ProfileFormValues;
  labels?: Partial<ProfileLabels>;
  isSaving?: boolean;
  onSubmit: (values: ProfileFormValues) => void | Promise<unknown>;
  /** Optional availability probe, called on username blur. */
  onCheckUsername?: (username: string) => Promise<UsernameCheck | null>;
};

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function ProfileSettingsForm({
  initial,
  labels,
  isSaving = false,
  onSubmit,
  onCheckUsername,
}: ProfileSettingsFormProps) {
  const copy = { ...DEFAULT_PROFILE_LABELS, ...labels };
  const [values, setValues] = useState<ProfileFormValues>(initial);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const set =
    (field: keyof ProfileFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
      if (field === "username") setUsernameStatus("idle");
    };

  const checkUsername = async () => {
    if (!onCheckUsername || values.username.trim() === initial.username) return;
    setUsernameStatus("checking");
    const result = await onCheckUsername(values.username);
    if (result === null) return setUsernameStatus("idle");
    setUsernameStatus(
      !result.valid ? "invalid" : result.available ? "available" : "taken"
    );
  };

  const usernameHint: Record<UsernameStatus, string> = {
    idle: copy.usernameHelp,
    checking: copy.usernameChecking,
    available: copy.usernameAvailable,
    taken: copy.usernameTaken,
    invalid: copy.usernameInvalid,
  };
  const usernameBad = usernameStatus === "taken" || usernameStatus === "invalid";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(values);
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="profil-username">{copy.usernameLabel}</Label>
            <Input
              id="profil-username"
              value={values.username}
              onChange={set("username")}
              onBlur={() => void checkUsername()}
              aria-invalid={usernameBad || undefined}
              autoComplete="username"
              required
            />
            <p
              className={
                usernameBad
                  ? "text-sm text-destructive"
                  : "text-sm text-muted-foreground"
              }
            >
              {usernameHint[usernameStatus]}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profil-display-name">{copy.displayNameLabel}</Label>
            <Input
              id="profil-display-name"
              value={values.displayName}
              onChange={set("displayName")}
              autoComplete="name"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profil-bio">{copy.bioLabel}</Label>
            <Textarea
              id="profil-bio"
              value={values.bio}
              onChange={set("bio")}
              placeholder={copy.bioPlaceholder}
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="profil-avatar-url">{copy.avatarUrlLabel}</Label>
            <div className="flex items-start gap-3">
              <ProfileAvatar
                name={values.displayName}
                avatarUrl={values.avatarUrl || undefined}
                size={64}
                className="mt-0.5"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Input
                  id="profil-avatar-url"
                  value={values.avatarUrl}
                  onChange={set("avatarUrl")}
                  inputMode="url"
                  placeholder="https://"
                />
                <p className="text-sm text-muted-foreground">{copy.avatarUrlHelp}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? copy.saving : copy.save}
          </Button>
          {initial.username ? (
            <Button asChild variant="link" className="text-muted-foreground">
              <Link href={`/u/${initial.username}`}>{copy.viewPublicProfile}</Link>
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </form>
  );
}
