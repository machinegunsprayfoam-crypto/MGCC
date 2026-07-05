/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile the workspace package so its TypeScript source is bundled directly.
  transpilePackages: ["@mgcc/shared"],
  typedRoutes: true,
};

export default nextConfig;
