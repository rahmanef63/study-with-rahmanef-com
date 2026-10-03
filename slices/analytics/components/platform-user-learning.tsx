"use client";
import type { PlatformUserDetailData } from "../types";
import type { PlatformUsersCopy } from "../config/users-copy";
import { mergePlatformAnalyticsCopy } from "../config/platform-copy";
import { PlatformComparisonTable } from "./platform-comparison-table";
import { platformPercent, type AggregateColumn } from "../lib/platform-format";
import { userTime } from "../lib/users-format";

export function PlatformUserLearning({ data, copy }: { data: PlatformUserDetailData; copy: PlatformUsersCopy }) {
  type Community = PlatformUserDetailData["communities"][number];
  type Course = PlatformUserDetailData["courses"][number];
  type Read = PlatformUserDetailData["reads"][number];
  type Quiz = PlatformUserDetailData["quizzes"][number];
  const tableLabels = mergePlatformAnalyticsCopy();
  const membershipColumns: AggregateColumn<Community>[] = [
    { key: "name", label: copy.communities, value: (row) => row.name },
    { key: "role", label: copy.role, value: (row) => tableLabels[row.role] },
    { key: "status", label: copy.status, value: (row) => tableLabels[row.status] },
    { key: "joined", label: copy.joined, value: (row) => userTime(row.joinedAt, copy) },
  ];
  const courseColumns: AggregateColumn<Course>[] = [
    { key: "title", label: copy.course, value: (row) => row.title },
    { key: "community", label: copy.communities, value: (row) => row.communityName },
    { key: "progress", label: copy.progress, value: (row) => `${row.complete ? "" : "≥ "}${row.done} / ${row.complete ? "" : "≥ "}${row.total}` },
    { key: "percent", label: copy.percent, value: (row) => row.complete ? row.percent : null, format: (row) => platformPercent(row.complete ? row.percent : null) },
    { key: "status", label: copy.status, value: (row) => !row.complete ? copy.unknown : row.isComplete ? copy.completedCourse : copy.notCompleted },
    { key: "badge", label: copy.badges, value: (row) => row.badge ? copy.badgeEarned : copy.noBadge },
    { key: "coverage", label: copy.coverage, value: (row) => row.complete ? copy.complete : copy.partial },
  ];
  const readColumns: AggregateColumn<Read>[] = [
    { key: "title", label: copy.material, value: (row) => "title" in row && typeof row.title === "string" ? row.title : row.lessonId },
    { key: "at", label: copy.date, value: (row) => row.at, format: (row) => userTime(row.at, copy) },
  ];
  const quizColumns: AggregateColumn<Quiz>[] = [
    { key: "title", label: copy.quiz, value: (row) => "title" in row && typeof row.title === "string" ? row.title : row.quizId },
    { key: "score", label: copy.score, value: (row) => row.scorePct, format: (row) => platformPercent(row.scorePct) },
    { key: "passed", label: copy.result, value: (row) => row.passed ? copy.passed : copy.failed },
    { key: "at", label: copy.date, value: (row) => row.at, format: (row) => userTime(row.at, copy) },
  ];
  const base = { labels: tableLabels, minWidth: 560 };
  return <div className="min-w-0 space-y-6">
    <PlatformComparisonTable {...base} title={copy.currentMemberships} rows={data.communities} columns={membershipColumns} rowKey={(row) => row.tenantId} filename="study-keanggotaan.csv" empty={copy.noCommunities} />
    <PlatformComparisonTable {...base} title={copy.courses} hint={copy.courseHint} minWidth={850} rows={data.courses} columns={courseColumns} rowKey={(row) => row.courseId} filename="study-progres-pengguna.csv" empty={copy.noCourses} />
    <PlatformComparisonTable {...base} title={copy.reading} hint={copy.recentLimit} rows={data.reads} columns={readColumns} rowKey={(row) => `${row.lessonId}:${row.day}`} filename="study-bacaan-pengguna.csv" empty={copy.noReads} initialSortKey="at" initialDescending />
    <PlatformComparisonTable {...base} title={copy.quizResults} hint={copy.recentLimit} rows={data.quizzes} columns={quizColumns} rowKey={(row) => `${row.quizId}:${row.at}`} filename="study-kuis-pengguna.csv" empty={copy.noQuizzes} initialSortKey="at" initialDescending />
  </div>;
}
