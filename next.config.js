/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "bcryptjs",
    "sharp",
  ],
  // Optimize image handling
  images: {
    formats: ["image/webp", "image/avif"],
  },
  // Compress responses
  compress: true,
  // Enable strict mode
  reactStrictMode: true,
  // Skip TypeScript checks during build (for CI/production builds)
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === "true",
  },
  // Redirects for renamed routes
  async redirects() {
    return [
      {
        source: "/admin/users/:path*",
        destination: "/admin/members/:path*",
        permanent: true,
      },
      {
        source: "/admin/backup/:path*",
        destination: "/admin/backups/:path*",
        permanent: true,
      },
      {
        source: "/admin/change-requests/:path*",
        destination: "/admin/changes/:path*",
        permanent: true,
      },
      {
        source: "/admin/hof-year-configs/:path*",
        destination: "/admin/configuration/:path*",
        permanent: true,
      },
    ];
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob: https:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https://challenges.cloudflare.com; " +
              "frame-src 'self' https://challenges.cloudflare.com; " +
              "object-src 'self'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'self';",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
