import { redirect } from "next/navigation";
import { DEFAULT_COMMUNITY_SLUG, communityHref } from "@/lib/community";

// Single-community-first: the backend is fully multi-tenant, but a learner
// should land inside the flagship community, not on a picker. The directory is
// still there at /komunitas for anyone who wants it.
//
// Not `permanentRedirect`: DEFAULT_COMMUNITY_SLUG is env-configurable, and a
// 308 would be cached by browsers past a change.
export default function RootPage() {
  redirect(communityHref.home(DEFAULT_COMMUNITY_SLUG));
}
