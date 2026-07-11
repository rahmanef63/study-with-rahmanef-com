/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  cacheComponents: true,
  // geoip-lite loads its .dat data files from disk at runtime; the standalone
  // output tracer can't see those fs reads, so include them explicitly for the
  // beacon route or the Dokploy image ships without them (geo silently empty).
  outputFileTracingIncludes: {
    "/api/analytics": ["./node_modules/geoip-lite/data/**"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
