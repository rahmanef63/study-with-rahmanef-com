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
  // Wallpaper webps are the shell's first backdrop (appshell.css .wp-* CSS
  // backgrounds) but /public assets ship with max-age=0 by default, so browsers
  // revalidate them on every desktop boot. They are not content-hashed — an
  // image swap MUST rename the file — in practice they never change in place,
  // so cache them hard.
  async headers() {
    return [
      {
        source: "/wallpapers/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
