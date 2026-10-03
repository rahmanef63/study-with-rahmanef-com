/** Learning dates use one calendar on the server and every reader's device. */
export function formatEarnedDate(earnedAt: number, month: "long" | "short" = "long"): string {
  return new Date(earnedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}
