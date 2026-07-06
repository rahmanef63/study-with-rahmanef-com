import { cacheLife, cacheTag } from "next/cache";
import { fetchQuery } from "convex/nextjs";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { type CourseCardData } from "@/features/courses";
import { tenantsApi, type PublicTenant } from "@/features/tenants";

const options = { skipConvexDeploymentUrlCheck: true } as const;

export async function getPublicTenant(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant:${slug}`);

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return null;
  return (await fetchQuery(
    tenantsApi.getPublicBySlug,
    { slug },
    options
  )) as PublicTenant | null;
}

export async function getPublishedCourses(tenantId: Id<"tenants">) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tenant-courses:${tenantId}`);

  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return [];
  return (await fetchQuery(
    api.features.courses.queries.listPublished,
    { tenantId },
    options
  )) as CourseCardData[];
}
