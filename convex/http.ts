import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { trafficIngest } from "./features/traffic/http";

const http = httpRouter();
auth.addHttpRoutes(http);
http.route({ path: "/analytics/ingest", method: "POST", handler: trafficIngest });

export default http;
