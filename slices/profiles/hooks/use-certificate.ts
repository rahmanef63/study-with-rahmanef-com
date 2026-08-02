"use client";

// Reactive read for the public /sertifikat/<completionId> page (STATUS #24).
// The query is ANONYMOUS (etalase, AGENTS.md §6) so signed-out visitors can
// open a shared certificate link. An unknown/invalid id makes the query THROW
// NOT_FOUND; useQuery re-throws during render, where PublicProfileBoundary
// catches it (rr "data fetching": reads live in useQuery, never useEffect).
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Certificate, CertificateData } from "../types";

export function useCertificate(completionId: string): CertificateData {
  const certificate = useQuery(api.features.profiles.public.publicGetCertificate, {
    completionId,
  }) as Certificate | undefined;

  return {
    certificate: certificate ?? null,
    isLoading: certificate === undefined,
  };
}
