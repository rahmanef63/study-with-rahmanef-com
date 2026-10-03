"use client";
import type { PlatformAnalyticsData } from "../types";
import type { PlatformAnalyticsCopy } from "../config/platform-copy";
import { platformPercent, type AggregateColumn } from "../lib/platform-format";
import { PlatformComparisonTable } from "./platform-comparison-table";

type Community = PlatformAnalyticsData["communities"][number];
type Course = PlatformAnalyticsData["courses"][number];
type Lesson = PlatformAnalyticsData["lessons"][number];
type Quiz = PlatformAnalyticsData["quizzes"][number];
const passRate = (passed: number, attempts: number, complete: boolean) => complete && attempts > 0 ? Math.round(passed * 1000 / attempts) / 10 : null;

export function PlatformTables({ data, search, community, copy }: { data: PlatformAnalyticsData; search: string; community: string; copy: PlatformAnalyticsCopy }) {
  const names = new Map(data.communities.map((row) => [row.slug, row.name]));
  const courseNames = new Map(data.courses.map((row) => [row.courseId, row.title]));
  const term = search.trim().toLocaleLowerCase("id-ID");
  const matches = (title: string, slug: string) => (!community || community === slug) && `${title} ${names.get(slug) ?? slug}`.toLocaleLowerCase("id-ID").includes(term);
  const communityName = <Row extends { tenantSlug: string }>(): AggregateColumn<Row> => ({ key: "community", label: copy.community, value: (row) => names.get(row.tenantSlug) ?? row.tenantSlug });
  const coverage = <Row extends { complete: boolean }>(): AggregateColumn<Row> => ({ key: "complete", label: copy.completeness, value: (row) => row.complete ? copy.complete : copy.partial });
  const communityColumns: AggregateColumn<Community>[] = [
    { key: "name", label: copy.name, value: (row) => row.name },
    { key: "status", label: copy.status, value: (row) => copy[row.status] },
    ...(["members", "courses", "lessons", "activeLearners", "readMemberDays", "lessonCompletions", "badges", "quizAttempts", "quizPassed", "comments", "newMembers"] as const).map((key) => ({ key, label: copy[key], value: (row: Community) => row[key] })),
    coverage<Community>(),
  ];
  const courseColumns: AggregateColumn<Course>[] = [
    { key: "title", label: copy.name, value: (row) => row.title }, communityName<Course>(),
    { key: "status", label: copy.status, value: (row) => copy[row.status] },
    ...(["eligibleLessons", "badges", "quizAttempts", "quizPassed"] as const).map((key) => ({ key, label: copy[key], value: (row: Course) => row[key] })),
    { key: "passRate", label: copy.passRate, value: (row) => passRate(row.quizPassed, row.quizAttempts, row.complete), format: (row) => platformPercent(passRate(row.quizPassed, row.quizAttempts, row.complete)) }, coverage<Course>(),
  ];
  const lessonColumns: AggregateColumn<Lesson>[] = [
    { key: "title", label: copy.name, value: (row) => row.title }, communityName<Lesson>(),
    { key: "kind", label: copy.kind, value: (row) => row.kind === "skill" ? copy.skills : copy.lessons },
    { key: "status", label: copy.status, value: (row) => copy[row.status] },
    ...(["readMemberDays", "readers", "completions", "comments"] as const).map((key) => ({ key, label: key === "completions" ? copy.lessonCompletions : copy[key], value: (row: Lesson) => row[key] })), coverage<Lesson>(),
  ];
  const quizColumns: AggregateColumn<Quiz>[] = [
    { key: "title", label: copy.name, value: (row) => row.title }, communityName<Quiz>(),
    { key: "course", label: copy.courses, value: (row) => courseNames.get(row.courseId) ?? row.courseSlug },
    { key: "attempts", label: copy.quizAttempts, value: (row) => row.attempts },
    { key: "passed", label: copy.quizPassed, value: (row) => row.passed },
    { key: "passRate", label: copy.passRate, value: (row) => passRate(row.passed, row.attempts, row.complete), format: (row) => platformPercent(passRate(row.passed, row.attempts, row.complete)) },
    { key: "averageScore", label: copy.averageScore, value: (row) => row.averageScore }, coverage<Quiz>(),
  ];
  const base = { empty: copy.empty, labels: copy };
  const filename = (kind: string) => `study-${kind}-${data.period.from}-${data.period.to}.csv`;
  return <div className="min-w-0 space-y-8">
    <PlatformComparisonTable {...base} title={copy.communityTable} rows={data.communities.filter((row) => matches(row.name, row.slug))} columns={communityColumns} rowKey={(row) => row.tenantId} filename={filename("komunitas")} />
    <PlatformComparisonTable {...base} title={copy.courseTable} hint={copy.courseHint} rows={data.courses.filter((row) => matches(row.title, row.tenantSlug))} columns={courseColumns} rowKey={(row) => row.courseId} filename={filename("kelas")} />
    <PlatformComparisonTable {...base} title={copy.lessonTable} hint={copy.lessonHint} rows={data.lessons.filter((row) => matches(row.title, row.tenantSlug))} columns={lessonColumns} rowKey={(row) => row.lessonId} filename={filename("materi-skills")} />
    <PlatformComparisonTable {...base} title={copy.quizTable} hint={copy.quizHint} rows={data.quizzes.filter((row) => matches(`${row.title} ${courseNames.get(row.courseId) ?? row.courseSlug}`, row.tenantSlug))} columns={quizColumns} rowKey={(row) => row.quizId} filename={filename("kuis")} />
  </div>;
}
