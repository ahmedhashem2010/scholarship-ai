/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: false,
    // nodemailer resolves its transport modules dynamically, which webpack
    // mangles. Keeping it external makes it a real Node require at runtime.
    serverComponentsExternalPackages: ["nodemailer"],
  },
  staticPageGenerationTimeout: 0,
};

export default nextConfig
