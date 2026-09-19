import type { NextConfig } from "next";

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const isGitHubPages = process.env.GITHUB_PAGES === "true" || isGitHubActions;

const nextConfig: NextConfig = {
  ...(isGitHubPages ? { output: "export", basePath: "/hp-renewal" } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
