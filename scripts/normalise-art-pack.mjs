// Art-pack normaliser — ONE-OFF, RUN BY HAND:
//
//   node scripts/normalise-art-pack.mjs [--keep]
//
// Sibling of scripts/optimize-assets.mjs and deliberately NOT merged with it.
// That one maps a numbered export drop onto the PWA install surface (icons,
// social cards, avatars) where every output path is a published contract. This
// one takes an illustration drop and files it by ROLE. Different inputs,
// different rules, no shared branch worth having.
//
// NOT wired into `next build`, same reason as its sibling: these files change
// about once a quarter and the output bytes are committed. A build step would
// re-encode 47 MB of PNG on every Dokploy deploy to produce what git already
// holds.
//
// THREE THINGS THIS ENFORCES, each of which the drop got wrong:
//
//   1. DEDUPE BY CONTENT. The drop ships 91 files that are 76 distinct images.
//      Names are not evidence: `badge_new_learner_alt.png` is byte-identical to
//      `pixel_art_problem_solver_badge.png`, and the two badges those names
//      describe are CROSSED — the file called new-learner draws PROBLEM SOLVER.
//      Every output name below was assigned by opening the image.
//
//   2. RE-EXPORT AT THE SIZE ACTUALLY RENDERED. A 460px source behind a 64px
//      box is a quarter-megabyte of waste on a mid-range Android. CAP is the
//      longest side each role can be asked for at 2x.
//
//   3. FILE BY ROLE, INTO THE FOLDERS THAT ALREADY EXIST. next.config.mjs
//      grants `public, max-age=604800` to `/:dir(social|brand|ui|web|learning|
//      profiles)/:file*` — the `:file*` modifier spans nested segments, so
//      `ui/empty/x.webp` inherits it and a new top-level `art/` folder would
//      not. Extending the existing taxonomy also avoids standing up a second,
//      parallel one next to it.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// sharp resolves transitively through Next's image optimiser; it is not a
// declared dependency, for the reason given in optimize-assets.mjs.
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "public", "general");
const PUBLIC = join(ROOT, "public");

/** Longest side, per role, at 2x the largest box the app asks for. */
const CAP = {
  "ui/empty": 256, // EmptyMedia, ~96px rendered
  "ui/status": 256, // same box, plus the phone mockups
  "ui/spot": 320, // card leading art, ~128px rendered
  "learning/badge": 192, // badge wall tile, 44-64px rendered
  "learning/medal": 512, // parked; no box exists yet
  "learning/cover": 1200, // aspect-[2/1] card, ~600px rendered
  web: 1600, // hero column, ~832px rendered
  social: 1200, // parked; posted by hand, never fetched by us
};

/**
 * source basename -> [output path under public/, role]
 *
 * Ordered by role so the table reads as the tree it produces. Every unique
 * image in the drop appears exactly once; the assertion below fails the run if
 * that stops being true, which is the only guard against a silently dropped
 * file when this table is next edited.
 */
const PLAN = [
  // ── ui/empty — zero-data states. Text-free by inspection, which is the
  //    whole reason these replace the previous empty-*.webp attempt.
  ["03_empty_file_box.png", "ui/empty/generic.webp", "ui/empty"],
  ["01_book_module.png", "ui/empty/courses.webp", "ui/empty"],
  ["07_search_documents.png", "ui/empty/results.webp", "ui/empty"],
  ["10_mailbox_message.png", "ui/empty/notifications.webp", "ui/empty"],
  ["06_community_chat.png", "ui/empty/diskusi.webp", "ui/empty"],
  ["05_community_campfire.png", "ui/empty/anggota.webp", "ui/empty"],
  ["09_resource_folder.png", "ui/empty/resources.webp", "ui/empty"],
  ["12_calendar_schedule.png", "ui/empty/kalender.webp", "ui/empty"],
  ["13_analytics_dashboard.png", "ui/empty/statistik.webp", "ui/empty"],
  ["04_quiz_clipboard.png", "ui/empty/kuis.webp", "ui/empty"],
  ["10_search_magnifier.png", "ui/empty/search.webp", "ui/empty"],
  ["06_discovery_box.png", "ui/empty/discovery.webp", "ui/empty"],

  // ── ui/status — the app is fine, the world is not.
  ["02_search_question.png", "ui/status/not-found.webp", "ui/status"],
  ["08_offline_laptop.png", "ui/status/offline.webp", "ui/status"],
  ["29_mobile_offline.png", "ui/status/offline-mobile.webp", "ui/status"],
  ["31_maintenance_barrier.png", "ui/status/maintenance.webp", "ui/status"],
  ["04_hourglass_waiting.png", "ui/status/waiting.webp", "ui/status"],
  ["30_notification_bell.png", "ui/status/notification.webp", "ui/status"],
  ["28_mobile_download.png", "ui/status/install.webp", "ui/status"],

  // ── ui/spot — reusable, tied to no single state.
  ["01_mentor_desk.png", "ui/spot/mentor.webp", "ui/spot"],
  ["01_exploration_night.png", "ui/spot/exploration.webp", "ui/spot"],
  ["02_telescope_observing.png", "ui/spot/telescope-person.webp", "ui/spot"],
  ["06_telescope_explore.png", "ui/spot/telescope.webp", "ui/spot"],
  ["03_park_reading.png", "ui/spot/reading.webp", "ui/spot"],
  ["04_headphones_study.png", "ui/spot/study-headphones.webp", "ui/spot"],
  ["05_mobile_student.png", "ui/spot/student.webp", "ui/spot"],
  ["02_code_document.png", "ui/spot/code-document.webp", "ui/spot"],
  ["11_coding_laptop.png", "ui/spot/coding.webp", "ui/spot"],
  ["12_ai_brain.png", "ui/spot/ai-brain.webp", "ui/spot"],
  ["14_web_design_workspace.png", "ui/spot/web-design.webp", "ui/spot"],
  ["15_design_blueprint.png", "ui/spot/blueprint.webp", "ui/spot"],
  ["08_rocket_project.png", "ui/spot/rocket.webp", "ui/spot"],
  ["09_roadmap_map.png", "ui/spot/map.webp", "ui/spot"],
  ["03_roadmap_flag.png", "ui/spot/roadmap-path.webp", "ui/spot"],
  ["07_graduation_cap.png", "ui/spot/graduation.webp", "ui/spot"],
  ["26_mobile_rocket.png", "ui/spot/mobile-rocket.webp", "ui/spot"],
  ["27_mobile_graduation.png", "ui/spot/mobile-graduation.webp", "ui/spot"],

  // ── learning/badge — hexagons, text-free, alpha. A badge in this product is
  //    a completed course (`courseCompletions`, whose schema comment literally
  //    says "= badge"), so these are keyed by courseSlug, never by a taxonomy.
  ["16_badge_seedling.png", "learning/badge/seedling.webp", "learning/badge"],
  ["17_badge_compass.png", "learning/badge/compass.webp", "learning/badge"],
  ["18_badge_code.png", "learning/badge/code.webp", "learning/badge"],
  ["19_badge_lightbulb.png", "learning/badge/lightbulb.webp", "learning/badge"],
  ["20_badge_ai_brain.png", "learning/badge/ai-brain.webp", "learning/badge"],
  ["21_badge_growth.png", "learning/badge/growth.webp", "learning/badge"],
  ["22_badge_community.png", "learning/badge/community.webp", "learning/badge"],
  ["23_badge_calendar.png", "learning/badge/calendar.webp", "learning/badge"],
  ["24_badge_star.png", "learning/badge/star.webp", "learning/badge"],
  ["25_badge_trophy.png", "learning/badge/trophy.webp", "learning/badge"],
  ["11_badge_shield.png", "learning/badge/shield.webp", "learning/badge"],
  ["05_achievement_star.png", "learning/badge/achievement.webp", "learning/badge"],
  ["32_certificate_scroll.png", "learning/badge/certificate.webp", "learning/badge"],

  // ── learning/medal — PARKED. Named from the artwork, not the filename: the
  //    drop crosses new-learner and problem-solver (see header). All five bake
  //    ENGLISH plus the wordmark into a Bahasa-by-contract UI, and they name an
  //    achievement taxonomy no table, mutation or seed in this repo has.
  ["ai_enthusiast_pixel_badge.png", "learning/medal/ai-enthusiast.webp", "learning/medal"],
  ["badge_builder_alt.png", "learning/medal/builder.webp", "learning/medal"],
  ["badge_explorer_alt.png", "learning/medal/explorer.webp", "learning/medal"],
  ["badge_new_learner_alt.png", "learning/medal/problem-solver.webp", "learning/medal"],
  ["badge_problem_solver_alt.png", "learning/medal/new-learner.webp", "learning/medal"],

  // ── learning/cover — PARKED. Correctly shaped for the aspect-[2/1] cover
  //    slot and each bakes an ENGLISH title ("AI BASICS", "DATA ANALYSIS")
  //    onto a product whose courses are titled in Bahasa, plus the wordmark the
  //    rail already carries. Wiring four of thirteen courses would also leave a
  //    catalogue that is half raster and half procedural.
  ["ai_basics_a_retro_pixel_art_guide.png", "learning/cover/ai-basics.webp", "learning/cover"],
  ["pixel_prompt_engineering_course_thumbnail.png", "learning/cover/prompt-engineering.webp", "learning/cover"],
  ["pixel_web_development_with_ai.png", "learning/cover/web-development.webp", "learning/cover"],
  ["data_analysis_alt_1.png", "learning/cover/data-analysis.webp", "learning/cover"],
  ["data_analysis_alt_2.png", "learning/cover/data-analysis-2.webp", "learning/cover"],
  ["machine_learning_alt_1.png", "learning/cover/machine-learning.webp", "learning/cover"],
  ["machine_learning_alt_2.png", "learning/cover/machine-learning-2.webp", "learning/cover"],
  ["project_build_something_real.png", "learning/cover/project.webp", "learning/cover"],
  ["retro_pixel_resources_study_banner.png", "learning/cover/resources.webp", "learning/cover"],
  ["learning_roadmap_pixel_quest.png", "learning/cover/roadmap.webp", "learning/cover"],
  ["module_title_pixel_learning_folder.png", "learning/cover/module-template.webp", "learning/cover"],

  // ── web — full-bleed marketing scenes.
  ["study_with_rahman_night_coding_session.png", "web/scene-coding.webp", "web"],
  ["study_with_rahman_night_study_community.png", "web/scene-community.webp", "web"],
  ["study_with_rahman_pixel_learning_hub.png", "web/scene-about.webp", "web"],
  ["pixel_night_city_study_banner.png", "web/banner-skyline.webp", "web"],

  // ── social — PARKED, and filed here on purpose. Each of these is a finished
  //    card: wordmark, heading, body copy AND a drawn yellow button. That is a
  //    social post, not an illustration. Dropped into an EmptyState they would
  //    render a counterfeit button above the real one and repeat the copy the
  //    component already writes. `mockup-dashboard` is a picture of a loading
  //    skeleton, which no screen can ever legitimately show.
  ["belum_ada_aktivitas_mulai_belajar.png", "social/post-belum-ada-aktivitas.webp", "social"],
  ["pixel_study_community_invitation.png", "social/post-belum-gabung-komunitas.webp", "social"],
  ["pixel_study_no_results_screen.png", "social/post-tidak-ada-hasil.webp", "social"],
  ["pixel_study_progress_dashboard.png", "social/post-belum-ada-progress.webp", "social"],
  ["study_with_rahman_maintenance_screen.png", "social/post-maintenance.webp", "social"],
  ["pixel_study_dashboard_loading_screen.png", "social/mockup-dashboard.webp", "social"],
];

/**
 * Crops applied before the resize, as a fraction of the source.
 *
 * The skyline banner is the one large asset in the drop with no baked title —
 * except for a "STUDY WITH RAHMAN" wordmark and an icon strip along the bottom
 * edge, and the wordmark is clipped by the edge in the source. Trimming the
 * bottom band leaves pure skyline, which is what aspect-[5/1] wants.
 */
const CROP = {
  "web/banner-skyline.webp": { top: 0, height: 0.73 },
};

/**
 * Roles whose art is a CUTOUT and must sit on the page's own background.
 * Compositions (covers, scenes, social posts) are full-bleed by design and are
 * never de-keyed.
 */
const DEKEY_ROLES = new Set(["ui/empty", "ui/status", "ui/spot", "learning/badge"]);

/** Squared-distance tolerance for the flood fill, in 0-255 channel units.
 *  MEASURED, not guessed: at 28 the six worst cases (book, magnifier, campfire,
 *  folder, calendar, chat) lose 54-88% of canvas — all field — with their
 *  sparkles, embers and drop shadows intact. At 48 the fill starts eating art:
 *  the campfire loses its logs, the chat group loses its base shadow, the book
 *  loses the edge of its ribbon. */
const DEKEY_TOLERANCE = 28;

/**
 * Turn a baked flat field into real transparency.
 *
 * WHY THIS EXISTS. 21 of the 51 sprites in the drop ship a flat `#010e2e`
 * square instead of an alpha channel. `--background` is `#090f1c`, so those
 * land on the page as a visibly bluer rectangle that no token can correct —
 * which is, verbatim, the defect that got the PREVIOUS asset pack declined in
 * the comment at the top of components/ui/empty.tsx. Shipping them unfixed
 * would repeat a mistake this repo has already written down.
 *
 * FLOOD FILL FROM THE BORDER, not a global colour replace. Contiguity is the
 * whole safety property: these illustrations reuse the field navy inside the
 * artwork (the night sky behind a telescope, the glass of a magnifier lens),
 * and a global replace would punch holes straight through them. A fill seeded
 * only from border pixels can reach the field and nothing else.
 *
 * Runs at source resolution, before the resize, so the downscale anti-aliases
 * the new edge against transparency instead of against the old field colour.
 */
async function dekey(raw) {
  const { data, info } = await sharp(raw).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  // Already a cutout — a transparent corner means the exporter did its job.
  if (data[3] < 250) return null;

  const [sr, sg, sb] = [data[0], data[1], data[2]];
  const tol2 = DEKEY_TOLERANCE * DEKEY_TOLERANCE;
  const seen = new Uint8Array(W * H);
  const queue = [];
  for (let x = 0; x < W; x++) queue.push(x, 0, x, H - 1);
  for (let y = 0; y < H; y++) queue.push(0, y, W - 1, y);

  let head = 0;
  let cut = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const p = y * W + x;
    if (seen[p]) continue;
    const o = p * 4;
    const dr = data[o] - sr;
    const dg = data[o + 1] - sg;
    const db = data[o + 2] - sb;
    if (dr * dr + dg * dg + db * db > tol2) continue;
    seen[p] = 1;
    data[o + 3] = 0;
    cut++;
    queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return { buf: await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer(), cut: cut / (W * H) };
}

const sha = (b) => createHash("sha256").update(b).digest("hex");

/** Lossy q82 vs lossless, smaller wins — flat pixel art often encodes smaller
 *  lossless, which makes that the free-quality outcome rather than a trade. */
async function encode(pipeline) {
  const [lossy, lossless] = await Promise.all([
    pipeline.clone().webp({ quality: 82, effort: 6 }).toBuffer(),
    pipeline.clone().webp({ lossless: true, effort: 6 }).toBuffer(),
  ]);
  return lossless.length < lossy.length
    ? { buf: lossless, note: "lossless" }
    : { buf: lossy, note: "q82" };
}

const keep = process.argv.includes("--keep");

if (!existsSync(SRC)) throw new Error(`no drop at ${SRC}`);

// Content-hash the drop, then assert the plan covers it exactly. Both halves
// matter: a source in the plan but not on disk is a typo, a source on disk but
// not in the plan is a file about to be lost.
const onDisk = new Map(); // sha -> first basename, alphabetically
const aliases = new Map(); // basename -> canonical basename
for (const name of readdirSync(SRC).filter((f) => f.endsWith(".png")).sort()) {
  const h = sha(readFileSync(join(SRC, name)));
  if (onDisk.has(h)) aliases.set(name, onDisk.get(h));
  else onDisk.set(h, name);
}
const canonical = new Set(onDisk.values());
const planned = new Set(PLAN.map(([src]) => src));

const notOnDisk = [...planned].filter((s) => !canonical.has(s));
const notPlanned = [...canonical].filter((s) => !planned.has(s));
if (notOnDisk.length) throw new Error(`planned but absent (or a duplicate alias): ${notOnDisk.join(", ")}`);
if (notPlanned.length) throw new Error(`on disk but unplanned: ${notPlanned.join(", ")}`);
if (PLAN.length !== new Set(PLAN.map(([, out]) => out)).size) throw new Error("duplicate output path in PLAN");

let before = 0;
let after = 0;
const rows = [];

for (const [src, rel, role] of PLAN) {
  const raw = readFileSync(join(SRC, src));
  const meta = await sharp(raw).metadata();

  const keyed = DEKEY_ROLES.has(role) ? await dekey(raw) : null;
  let pipe = sharp(keyed?.buf ?? raw);
  const crop = CROP[rel];
  if (crop) {
    pipe = pipe.extract({
      left: 0,
      top: Math.round(meta.height * crop.top),
      width: meta.width,
      height: Math.round(meta.height * crop.height),
    });
  }

  const cap = CAP[role];
  const longest = Math.max(meta.width, crop ? Math.round(meta.height * crop.height) : meta.height);
  if (longest > cap) pipe = pipe.resize({ width: cap, height: cap, fit: "inside", kernel: "lanczos3" });

  const { buf, note } = await encode(pipe);
  const out = await sharp(buf).metadata();

  const dest = join(PUBLIC, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);

  before += raw.length;
  after += buf.length;
  rows.push([
    rel,
    `${meta.width}x${meta.height}`,
    `${out.width}x${out.height}`,
    raw.length,
    buf.length,
    `${(100 - (buf.length / raw.length) * 100).toFixed(0)}%`,
    [note, crop && "crop", keyed && `dekey ${(keyed.cut * 100).toFixed(0)}%`].filter(Boolean).join(" +"),
  ]);
}

for (const r of rows) console.log(r.join("\t"));
console.log(
  `\n${PLAN.length} files\t${before}\t${after}\tsaved ${(before - after).toLocaleString()} B (${(
    100 -
    (after / before) * 100
  ).toFixed(1)}%)`
);
console.log(`${aliases.size} duplicate source names dropped: ${[...aliases.keys()].join(", ")}`);

if (!keep) {
  rmSync(SRC, { recursive: true });
  console.log(`\nremoved ${SRC} — the originals belong outside the repo, see docs/ASSETS.md`);
}
