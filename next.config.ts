import type { NextConfig } from "next";
import withBundleAnalyzerFn from "@next/bundle-analyzer";

const withBundleAnalyzer = withBundleAnalyzerFn({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  // Optimize barrel imports — tree-shake supaya cuma yang dipake yg masuk chunk
  // Recharts + lucide-react + framer-motion punya re-export index yang gede.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "framer-motion",
      "date-fns",
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
