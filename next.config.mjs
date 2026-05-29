/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force server-side rendering, no static export
  output: 'standalone',
  // Disable ISR and static generation
  reactStrictMode: false,
};

export default nextConfig
