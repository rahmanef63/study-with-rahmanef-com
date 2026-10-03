import { MarkdownView } from "../../slices/courses/components/markdown-view";
import { YoutubeEmbed } from "../../slices/courses/components/youtube-embed";
import { fixtureVideoId } from "./media-adapter";
const richtext = [
  "## Prompt fixture", "", "Buat ringkasan untuk \\[BRAND NAME\\] dan \\[PRODUCT NAME\\]. **Jaga *format bertingkat* ini**. \\*Tanda literal\\* tetap menjadi teks.", "",
  "Paragraf dengan satu baris lanjutan", "yang tetap berada dalam satu paragraf.", "",
  "3. Langkah pertama", "  - Anak langkah", "    1. Langkah di dalam anak", "4. Langkah kedua", "",
  "| Kolom | Isi |", "| :--- | ---: |", "| `kode|pipa` | literal\\|pipa |", "",
  "````bash-session", "printf '%s\\n' '[BRAND NAME]'", "```json", '{"safe": true, "text": "<script>literal code only</script>"}', "```", "````", "",
  ":::details Penjelasan tambahan", ":::details Detail di dalam detail", "Isi **detail** fixture.", ":::", ":::", "",
  `:::embed https://www.youtube.com/watch?v=${fixtureVideoId}&t=62`, "",
  "[Tautan referensi **tebal**](https://example.org/a_(b))", "",
  '<iframe src="https://evil.example/unsafe" onload="alert(1)"></iframe>',
].join("\n");
export function FixtureRichtext() {
  return <div className="min-w-0 space-y-8"><p className="text-sm text-muted-foreground">Sumber sintetik; bukan materi produksi. Metadata fixture disediakan sebagai props lokal; tidak memanggil endpoint metadata.</p><MarkdownView content={richtext} /><section className="border-t border-border pt-6" aria-label="Video utama kursus"><h2 className="text-lg font-semibold">Video utama fixture</h2><YoutubeEmbed videoId={fixtureVideoId} title="Judul authored fixture" /></section></div>;
}
