/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable all static export - use serverless only
  experimental: {
    ppr: false,
  },
  // Don't try to optimize for static - just run as serverless
  staticPageGenerationTimeout: 0,
};

export default nextConfig
