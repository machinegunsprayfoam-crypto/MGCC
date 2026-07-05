/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produce a self-contained Node server (.next/standalone/server.js) that
  // bundles the app plus its dependencies into a runnable executable. This is
  // the deployment target for self-hosting / containers, and serves SSR pages
  // and API routes without needing the full node_modules tree at runtime.
  output: "standalone",
  // Transpile the workspace package so its TypeScript source is bundled directly.
  transpilePackages: ["@mgcc/shared"],
  typedRoutes: true,
};

export default nextConfig;
