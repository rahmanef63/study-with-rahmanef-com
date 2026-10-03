import type { McpScope } from "./contract";

type Field = { type: "string" | "number" | "integer"; optional?: boolean; maxLength?: number; enum?: readonly (number | string)[]; minimum?: number; maximum?: number };
const id = { type: "string", maxLength: 128 } as const;
const period = { type: "integer", enum: [7, 30, 90] } as const;
export type Capability = { id: string; scope: McpScope; description: string; fields: Record<string, Field>; readOnly: boolean; destructive: boolean; idempotent: boolean };
const read = (id: string, scope: McpScope, description: string, fields: Record<string, Field> = {}): Capability => ({ id, scope, description, fields, readOnly: true, destructive: false, idempotent: true });
const write = (id: string, scope: McpScope, description: string, fields: Record<string, Field>, destructive = false, idempotent = true): Capability => ({ id, scope, description, fields, readOnly: false, destructive, idempotent });

/** Static capability data behind two stable MCP tools, never dynamic tools. */
export const CAPABILITIES: readonly Capability[] = [
  read("user.profile", "user", "Profil akun sendiri"),
  read("user.communities", "user", "Komunitas aktif yang diikuti dan peran sendiri"),
  read("user.library", "user", "Pustaka materi/skill berpaginasi sesuai izin anggota; gunakan continueCursor", { tenantId: id, kind: { type: "string", enum: ["materi", "skill"], optional: true }, tag: { type: "string", maxLength: 80, optional: true }, sort: { type: "string", enum: ["newest", "oldest", "title"], optional: true }, cursor: { type: "string", maxLength: 2048, optional: true }, limit: { type: "integer", minimum: 1, maximum: 20, optional: true } }),
  read("user.course_catalog", "user", "Kelas terbit pada komunitas aktif", { tenantId: id }),
  read("user.course_overview", "user", "Silabus kelas sesuai izin akun", { tenantId: id, courseSlug: { type: "string", maxLength: 100 } }),
  read("user.lesson", "user", "Konten materi sesuai keanggotaan dan visibilitas", { lessonId: id, courseId: { ...id, optional: true } }),
  read("user.course_progress", "user", "Progress kelas milik akun sendiri", { courseId: id }),
  read("user.lesson_comments", "user", "Komentar materi bagi anggota yang berhak", { lessonId: id }),
  read("user.post_comments", "user", "Komentar diskusi bagi anggota yang berhak", { postId: id }),
  write("user.complete_lesson", "user", "Tandai materi selesai untuk akun sendiri; idempotent", { lessonId: id }),
  write("user.comment_add", "user", "Tambah komentar/reply pada tepat satu materi atau post", { lessonId: { ...id, optional: true }, postId: { ...id, optional: true }, bodyMd: { type: "string", maxLength: 2000 }, parentId: { ...id, optional: true } }, false, false),
  write("user.comment_delete", "user", "Soft-delete komentar sendiri atau yang boleh dimoderasi", { commentId: id }, true),
  read("admin.learning_analytics", "admin", "Analitik pembelajaran platform, kelengkapan sumber dan inventori", { days: period }),
  read("admin.traffic_analytics", "admin", "Statistik kunjungan platform dengan batas cakupan dan retensi", { days: { type: "integer", enum: [7, 30] } }),
  read("admin.pending_communities", "admin", "Permohonan komunitas pending; proyeksi aman tanpa webhook", { limit: { type: "integer", optional: true, minimum: 1, maximum: 100 } }),
  write("admin.approve_community", "admin", "Aktifkan komunitas dan pastikan pemohon menjadi owner", { tenantId: id }),
  write("admin.suspend_community", "admin", "Suspend/tolak komunitas; menghentikan akses konten anggotanya", { tenantId: id }, true),
];
export function capabilityDescriptor(c: Capability) {
  return { id: c.id, description: c.description, readOnly: c.readOnly, destructive: c.destructive, idempotent: c.idempotent,
    inputSchemaJson: JSON.stringify({ type: "object", properties: Object.fromEntries(Object.entries(c.fields).map(([key, field]) => { const schema = { ...field }; delete schema.optional; return [key, schema]; })), required: Object.entries(c.fields).filter(([, field]) => !field.optional).map(([key]) => key), additionalProperties: false }),
  };
}
