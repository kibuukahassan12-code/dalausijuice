/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: { optimizePackageImports: ["recharts"] }
};

module.exports = nextConfig;
