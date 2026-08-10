/// <reference types="vite/client" />
// MATERI mutations — the P0 youtubeVideoId gate (11-char ID, never a URL),
// authz-denied paths, tenant-scoped slug uniqueness, the "created in NO course"
// rule, publish/unpublish, and the completion-protects-deletion invariant
// (docs/DATA-MODEL.md).
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { asUser, placeMateri, seedCourse, seedMateri, seedTenantFixture, setup } from "./test.helpers";

const baseMateri = { title: "Materi Baru", contentMd: "Materi baru", links: [] };

test("createLesson: full YouTube URLs are rejected, a bare 11-char ID is accepted", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  for (const url of [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "youtube.com/embed/dQw4w9WgXcQ",
    "dQw4w9WgXc", // 10 chars
    "dQw4w9WgXcQQ", // 12 chars
  ]) {
    await expect(
      asInstructor.mutation(api.features.courses.lessons.createLesson, {
        tenantId: fx.tenantId,
        ...baseMateri,
        youtubeVideoId: url,
      })
    ).rejects.toThrow(/VALIDATION_FAILED/);
  }

  const lessonId = (await asInstructor.mutation(api.features.courses.lessons.createLesson, {
    tenantId: fx.tenantId,
    ...baseMateri,
    youtubeVideoId: "dQw4w9WgXcQ",
  })) as Id<"lessons">;
  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(lesson?.youtubeVideoId).toBe("dQw4w9WgXcQ");
});

test("createLesson: anon NOT_AUTHENTICATED, member NOT_AUTHORIZED, owner passes the gate", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const args = { tenantId: fx.tenantId, ...baseMateri };

  await expect(
    t.mutation(api.features.courses.lessons.createLesson, args)
  ).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.lessons.createLesson, args)
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const lessonId = (await t
    .withIdentity(asUser(fx.ownerId))
    .mutation(api.features.courses.lessons.createLesson, args)) as Id<"lessons">;
  const lesson = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(lesson?.youtubeVideoId).toBeUndefined();
  expect(lesson?.authorId).toBe(fx.ownerId);
});

test("createLesson: the materi lands in NO course, gets a tenant-unique slug", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  const firstId = (await asInstructor.mutation(api.features.courses.lessons.createLesson, {
    tenantId: fx.tenantId,
    ...baseMateri,
  })) as Id<"lessons">;
  const secondId = (await asInstructor.mutation(api.features.courses.lessons.createLesson, {
    tenantId: fx.tenantId,
    ...baseMateri, // same title → the slug must not collide
  })) as Id<"lessons">;

  const [first, second, placements] = await t.run(async (ctx) => [
    await ctx.db.get(firstId),
    await ctx.db.get(secondId),
    await ctx.db
      .query("courseLessons")
      .withIndex("by_lesson", (q) => q.eq("lessonId", firstId))
      .collect(), // TODO(rr): bounded table — empty by construction in this spec
  ]);
  expect(first?.slug).toBe("materi-baru");
  expect(second?.slug).toBe("materi-baru-2");
  expect(first?.status).toBe("published");
  expect(placements).toHaveLength(0); // in no course until explicitly placed

  // An explicit slug that is already taken is rejected, not silently suffixed.
  await expect(
    asInstructor.mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...baseMateri,
      slug: "materi-baru",
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
});

test("createLesson: status draft is honoured and hides the materi from members", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = (await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.createLesson, {
      tenantId: fx.tenantId,
      ...baseMateri,
      status: "draft",
    })) as Id<"lessons">;

  await expect(
    t.withIdentity(asUser(fx.memberId)).query(api.features.courses.queries.getLesson, { lessonId })
  ).rejects.toThrow(/NOT_FOUND/);
});

test("updateLesson: null clears the video, invalid link protocol is rejected, slug is re-checked", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "draft");
  const otherId = await seedMateri(t, fx, { title: "Materi Lain", slug: "materi-lain" });
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId,
    youtubeVideoId: null,
  });
  const cleared = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(cleared?.youtubeVideoId).toBeUndefined();

  await expect(
    asInstructor.mutation(api.features.courses.lessons.updateLesson, {
      lessonId,
      links: [{ label: "FTP jadul", url: "ftp://example.com/file" }],
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await expect(
    asInstructor.mutation(api.features.courses.lessons.updateLesson, {
      lessonId,
      slug: "materi-lain", // taken by another materi in this tenant
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  // Its OWN slug is not a collision with itself.
  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId: otherId,
    slug: "materi-lain",
  });
});

test("setLessonStatus: member denied; unpublishing hides the materi from every course", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.lessons.setLessonStatus, {
      lessonId,
      status: "draft",
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.setLessonStatus, { lessonId, status: "draft" });
  const overview = await t
    .withIdentity(asUser(fx.memberId))
    .query(api.features.courses.queries.getOverview, {
      tenantId: fx.tenantId,
      courseSlug: "kelas-published",
    });
  expect(overview.lessonCount).toBe(0);
  expect(courseId).toBeDefined();
});

test("deleteLesson: blocked once a member has completed it, allowed otherwise", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await expect(
    t.withIdentity(asUser(fx.memberId)).mutation(api.features.courses.lessons.deleteLesson, {
      lessonId,
    })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId,
      userId: fx.memberId,
      courseId,
      lessonId,
    });
  });
  await expect(
    asInstructor.mutation(api.features.courses.lessons.deleteLesson, { lessonId })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  await t.run(async (ctx) => {
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user_lesson", (q) => q.eq("userId", fx.memberId).eq("lessonId", lessonId))
      .collect(); // TODO(rr): bounded table — one row, seeded above
    for (const completion of completions) await ctx.db.delete(completion._id);
  });
  await asInstructor.mutation(api.features.courses.lessons.deleteLesson, { lessonId });
  const gone = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(gone).toBeNull();
});

test("deleteLesson: cascades to placements, tags and refs — no dangling rows", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId } = await seedCourse(t, fx, "published");
  const doomed = await seedMateri(t, fx, { title: "Materi Hapus", slug: "materi-hapus" });
  const survivor = await seedMateri(t, fx, { title: "Materi Sisa", slug: "materi-sisa" });
  await placeMateri(t, fx, courseId, doomed, 2);
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonTags", { tenantId: fx.tenantId, tag: "prompting", lessonId: doomed });
    await ctx.db.insert("lessonRefs", {
      tenantId: fx.tenantId,
      fromLessonId: doomed,
      toLessonId: survivor,
    });
    await ctx.db.insert("lessonRefs", {
      tenantId: fx.tenantId,
      fromLessonId: survivor,
      toLessonId: doomed,
    });
  });

  await t
    .withIdentity(asUser(fx.instructorId))
    .mutation(api.features.courses.lessons.deleteLesson, { lessonId: doomed });

  const leftovers = await t.run(async (ctx) => ({
    placements: await ctx.db
      .query("courseLessons")
      .withIndex("by_lesson", (q) => q.eq("lessonId", doomed))
      .collect(), // TODO(rr): bounded table — per-materi placements
    tags: await ctx.db
      .query("lessonTags")
      .withIndex("by_lesson", (q) => q.eq("lessonId", doomed))
      .collect(), // TODO(rr): bounded table — per-materi tags
    refsFrom: await ctx.db
      .query("lessonRefs")
      .withIndex("by_from", (q) => q.eq("fromLessonId", doomed))
      .collect(), // TODO(rr): bounded table — per-materi refs
    refsTo: await ctx.db
      .query("lessonRefs")
      .withIndex("by_to", (q) => q.eq("toLessonId", doomed))
      .collect(), // TODO(rr): bounded table — per-materi backlinks
  }));
  expect(leftovers.placements).toHaveLength(0);
  expect(leftovers.tags).toHaveLength(0);
  expect(leftovers.refsFrom).toHaveLength(0);
  expect(leftovers.refsTo).toHaveLength(0);
  expect(await t.run(async (ctx) => ctx.db.get(survivor))).not.toBeNull();
});

test("getLessonForManage: member denied, instructor reads draft content for the editor", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { lessonId } = await seedCourse(t, fx, "draft");

  await expect(
    t
      .withIdentity(asUser(fx.memberId))
      .query(api.features.courses.manage.getLessonForManage, { lessonId })
  ).rejects.toThrow(/NOT_AUTHORIZED/);

  const lesson = await t
    .withIdentity(asUser(fx.instructorId))
    .query(api.features.courses.manage.getLessonForManage, { lessonId });
  expect(lesson.contentMd).toContain("Materi pertama");
  expect(lesson).not.toHaveProperty("courseId");
  expect(lesson).not.toHaveProperty("moduleId");
});

// The regression the by_lesson index exists for. A materi taught by TWO courses
// records completions with `courseId` undefined, so the old placement-scoped
// probe found nothing and happily deleted work members had already finished.
test("deleteLesson: a shared materi's completion blocks deletion even with no courseId", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const { courseId, lessonId } = await seedCourse(t, fx, "published");
  const second = await t.run(async (ctx) =>
    ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug: "kelas-kedua",
      title: "Kelas Kedua",
      description: "Mengajarkan materi yang sama.",
      status: "published",
      createdBy: fx.instructorId,
    })
  );
  await placeMateri(t, fx, second, lessonId, 1);
  expect(second).not.toEqual(courseId);

  // Provenance is undefined precisely because the materi has two homes.
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonCompletions", {
      tenantId: fx.tenantId,
      userId: fx.memberId,
      lessonId,
    });
  });

  await expect(
    t
      .withIdentity(asUser(fx.instructorId))
      .mutation(api.features.courses.lessons.deleteLesson, { lessonId })
  ).rejects.toThrow(/VALIDATION_FAILED/);
  expect(await t.run(async (ctx) => ctx.db.get(lessonId))).not.toBeNull();
});

// DECISIONS #38: one body, one write path. Blocks are canonical where they
// exist, so the markdown field must not be independently writable — otherwise
// the editor's next save re-derives contentMd from stale blocks and eats it.
test("updateLesson: refuses contentMd once the materi has blocks", async () => {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const lessonId = await seedMateri(t, fx, { title: "Sub Agents" });
  const asInstructor = t.withIdentity(asUser(fx.instructorId));

  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId,
    contentMd: "# Sub Agents\n\nVersi markdown.",
  });

  await t.run(async (ctx) => {
    await ctx.db.patch(lessonId, { contentBlocks: '[{"type":"paragraph","text":"blok"}]' });
  });

  await expect(
    asInstructor.mutation(api.features.courses.lessons.updateLesson, {
      lessonId,
      contentMd: "# Sub Agents\n\nEdit yang akan hilang.",
    })
  ).rejects.toThrow(/VALIDATION_FAILED/);

  // Everything else about the materi stays editable.
  await asInstructor.mutation(api.features.courses.lessons.updateLesson, {
    lessonId,
    title: "Sub Agents (revisi)",
  });
  const after = await t.run(async (ctx) => ctx.db.get(lessonId));
  expect(after?.title).toEqual("Sub Agents (revisi)");
  expect(after?.contentMd).toContain("Versi markdown");
});
