import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-native", "@prisma/adapter-pg", "@prisma/client", ".prisma/client"],
};

export default nextConfig;
