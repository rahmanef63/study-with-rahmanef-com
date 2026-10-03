import { expect, test } from "vitest";
import { badgeArtForCourse } from "./badge-art";

test("seeded courses each get their own badge sprite", () => {
  expect(badgeArtForCourse("dasar-ai")).toBe("/learning/badge/seedling.webp");
  expect(badgeArtForCourse("prompt-engineering")).toBe("/learning/badge/lightbulb.webp");
  expect(badgeArtForCourse("bikin-aplikasi-web-dengan-ai")).toBe("/learning/badge/code.webp");
  expect(badgeArtForCourse("analisis-data-dengan-ai")).toBe("/learning/badge/ai-brain.webp");
  expect(badgeArtForCourse("ai-produktivitas-kerja")).toBe("/learning/badge/growth.webp");
  expect(badgeArtForCourse("orkestrasi-multi-agent")).toBe("/learning/badge/community.webp");
  expect(badgeArtForCourse("ide-konten")).toBe("/learning/badge/compass.webp");
  expect(badgeArtForCourse("skrip-caption")).toBe("/learning/badge/calendar.webp");
  expect(badgeArtForCourse("portofolio-dilirik")).toBe("/learning/badge/star.webp");
  expect(badgeArtForCourse("freelance-nol")).toBe("/learning/badge/shield.webp");
});

test("a course without a mapped sprite falls back to the achievement mark", () => {
  expect(badgeArtForCourse("kelas-baru")).toBe("/learning/badge/achievement.webp");
  expect(badgeArtForCourse("")).toBe("/learning/badge/achievement.webp");
});
