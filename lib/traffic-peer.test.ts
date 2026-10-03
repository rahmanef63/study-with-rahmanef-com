import { expect, test } from "vitest";
import { isCloudflareTrafficPeer, publicTrafficIp, trafficLocationIp } from "./traffic-peer";

const headers = (peer: string, connecting?: string) => new Headers({ "x-forwarded-for": peer, ...(connecting ? { "cf-connecting-ip": connecting } : {}) });

test("verified Cloudflare IPv4/IPv6 peer permits the connecting visitor address", () => {
  expect(trafficLocationIp(headers("1.1.1.1, 104.16.0.20", "8.8.8.8"))).toBe("8.8.8.8");
  expect(trafficLocationIp(headers("2606:4700::123", "2001:4860:4860::8888"))).toBe("2001:4860:4860::8888");
  expect(trafficLocationIp(headers("::ffff:104.16.0.20", "::ffff:8.8.8.8"))).toBe("8.8.8.8");
});

test("caller-controlled earlier hops and CF headers cannot override the observed direct peer", () => {
  const request = headers("104.16.0.20, 8.8.8.8", "1.1.1.1");
  request.set("cf-ipcountry", "FR");
  expect(trafficLocationIp(request)).toBe("8.8.8.8");
  expect(trafficLocationIp(headers("8.8.8.8", "1.1.1.1"))).toBe("8.8.8.8");
  expect(isCloudflareTrafficPeer("104.16.0.20")).toBe(true);
  expect(isCloudflareTrafficPeer("104.15.255.255")).toBe(false);
});

test("missing/malformed peer information cannot fall back to caller X-Real-IP", () => {
  const request = new Headers({ "x-real-ip": "8.8.8.8", "cf-connecting-ip": "1.1.1.1" });
  expect(trafficLocationIp(request)).toBeNull();
  for (const value of ["8.8.8.8,", "not-an-ip", "8.8.8.8:443", "x".repeat(4097)]) expect(trafficLocationIp(headers(value))).toBeNull();
});

test("loopback/private/reserved/mapped/private IPv6 and noncanonical IPv4 inputs stay unknown", () => {
  for (const ip of ["127.0.0.1", "10.1.1.1", "172.16.0.1", "192.168.1.1", "169.254.1.1", "100.64.0.1", "0.0.0.0", "224.0.0.1", "240.0.0.1", "192.0.2.1", "::1", "fc00::1", "fe80::1", "2001:db8::1", "::ffff:127.0.0.1", "::ffff:192.168.1.1", "fe80::1%eth0", "0x08080808", "010.0.0.1", "8.8.8"]) expect(publicTrafficIp(ip), ip).toBeNull();
  expect(publicTrafficIp("::ffff:8.8.8.8")).toBe("8.8.8.8");
  expect(publicTrafficIp("2001:4860:4860::8888")).toBe("2001:4860:4860::8888");
});

test("missing/synthetic/worker connecting IPs never geolocate the Cloudflare edge instead", () => {
  for (const visitor of [undefined, "not-an-ip", "10.0.0.1", "240.1.1.1", "2a06:98c0:3600::103", "8.8.8.8,1.1.1.1"]) expect(trafficLocationIp(headers("104.16.0.20", visitor))).toBeNull();
  const worker = headers("104.16.0.20", "8.8.8.8"); worker.set("cf-worker", "worker.example");
  expect(trafficLocationIp(worker)).toBeNull();
});
