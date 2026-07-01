import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["exceljs", "jszip", "@prisma/client"],
};

export default nextConfig;
