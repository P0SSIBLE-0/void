import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  experimental:{
    turbopackFileSystemCacheForDev:true
  },
  // cacheComponents:true
};

export default nextConfig;
