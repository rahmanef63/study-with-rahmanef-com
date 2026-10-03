import type { PlatformUserActivity, PlatformUserData } from "../types";
import type { PlatformUsersCopy } from "../config/users-copy";
import { platformDate, platformNumber } from "./platform-format";

export const userCount = ({ value, exact }: { value: number; exact: boolean }) => `${exact ? "" : "≥ "}${platformNumber(value)}`;
export const userTime = (at: number | null, copy: PlatformUsersCopy) => at === null ? copy.noActivity : platformDate(at, true);
export const userStatus = (status: PlatformUserData["status"], copy: PlatformUsersCopy) => ({ "belum-belajar": copy.notStarted, "belum-diketahui": copy.unknownLearning, belajar: copy.learningNow, "memiliki-badge": copy.hasBadge })[status];
export const userLocation = (event: PlatformUserActivity | null, copy: PlatformUsersCopy) => [event?.city, event?.country].filter(Boolean).join(", ") || copy.unknown;
export const userSource = (event: PlatformUserActivity | null, copy: PlatformUsersCopy) => event?.utmSource || event?.referrerHost || copy.directOrUnknown;
