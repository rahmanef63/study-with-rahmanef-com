// "Lanjutkan belajar" tracker — a tiny localStorage list of the courses the
// user most recently opened, so Beranda can offer one-click resume. This is
// deliberately NOT appshell's built-in recents: that tracks app *ids* (all
// courses share the single "kelas" id), which is useless for a payload-driven
// app. Here we key on the tenant+course slug pair carried in the open payload.
//
// SSR-safe: every access guards `typeof window` and swallows storage errors,
// so it is a no-op on the server and never throws in private-mode / quota edge
// cases. Recents are best-effort UX sugar, not a source of truth.

const KEY = "swr:recent-courses";
const CAP = 6;

export type RecentCourse = {
  tenantSlug: string;
  courseSlug: string;
  title: string;
};

/** Newest-first list of recently opened courses (client-only; [] on server). */
export function getRecentCourses(): RecentCourse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (c): c is RecentCourse =>
          c != null &&
          typeof (c as RecentCourse).tenantSlug === "string" &&
          typeof (c as RecentCourse).courseSlug === "string" &&
          typeof (c as RecentCourse).title === "string"
      )
      .slice(0, CAP);
  } catch {
    return [];
  }
}

/** Record (or bump to newest) a course. Deduped by tenantSlug+courseSlug,
 *  newest-first, capped at CAP. No-op on the server. */
export function recordRecentCourse(course: RecentCourse): void {
  if (typeof window === "undefined") return;
  if (!course.tenantSlug || !course.courseSlug) return;
  try {
    const next = [
      { tenantSlug: course.tenantSlug, courseSlug: course.courseSlug, title: course.title },
      ...getRecentCourses().filter(
        (c) => !(c.tenantSlug === course.tenantSlug && c.courseSlug === course.courseSlug)
      ),
    ].slice(0, CAP);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore serialization / quota / private-mode errors — best-effort only
  }
}
