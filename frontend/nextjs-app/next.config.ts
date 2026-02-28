import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // bcryptjs 3.x is pure ESM; Prisma also needs native Node resolution.
  // Exclude them from webpack bundling so Node resolves them directly.
  serverExternalPackages: ["bcryptjs", "@prisma/client", "prisma"],
};

export default nextConfig;
