/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: false,
  },
  staticPageGenerationTimeout: 0,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ canvas: "commonjs canvas" });
    }
    return config;
  },
};

export default nextConfig
