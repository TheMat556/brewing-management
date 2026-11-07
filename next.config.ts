import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    cacheComponents: true,
    partialPrefetching: true,
    allowedDevOrigins: isDev ? ["code.hader.ovh"] : undefined,
    basePath: isDev ? process.env.NEXT_PUBLIC_BASE_PATH || undefined : undefined,
    async redirects() {
      return [{ source: "/", destination: "/dashboard", permanent: false }];
    },
  };
};
