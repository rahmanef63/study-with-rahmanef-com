import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("purge expired visitor analytics", { hours: 1 }, internal.features.traffic.retention.purge);
export default crons;
