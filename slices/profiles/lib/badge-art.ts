// Course-completion badges. A badge in this product is a finished course
// (`courseCompletions`, schema comment "= badge"), so the art is keyed by the
// seeded course slug. Unknown slugs — a course added later — fall back to the
// generic achievement mark rather than a broken image.
//
// Paths are literals on purpose: app/__tests__/public-assets.test.ts only
// checks quoted paths, so a template would never be verified against disk.

const BADGE_ART = {
  "dasar-ai": "/learning/badge/seedling.webp",
  "prompt-engineering": "/learning/badge/lightbulb.webp",
  "bikin-aplikasi-web-dengan-ai": "/learning/badge/code.webp",
  "analisis-data-dengan-ai": "/learning/badge/ai-brain.webp",
  "ai-produktivitas-kerja": "/learning/badge/growth.webp",
  "orkestrasi-multi-agent": "/learning/badge/community.webp",
  "ide-konten": "/learning/badge/compass.webp",
  "skrip-caption": "/learning/badge/calendar.webp",
  "portofolio-dilirik": "/learning/badge/star.webp",
  "freelance-nol": "/learning/badge/shield.webp",
} as const;

const FALLBACK = "/learning/badge/achievement.webp";

export function badgeArtForCourse(courseSlug: string): string {
  if (Object.prototype.hasOwnProperty.call(BADGE_ART, courseSlug)) {
    return BADGE_ART[courseSlug as keyof typeof BADGE_ART];
  }
  return FALLBACK;
}
