/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "core.telegram.org",
      },
      {
        protocol: 'https',
        hostname: "i.ibb.co",
      },
      {
        protocol: 'https',
        hostname: "*.ibb.co",
      },
      {
        protocol: 'https',
        hostname: "t.me",
      },
      {
        protocol: 'https',
        hostname: "api.telegram.org",
      },
      {
        protocol: 'https',
        hostname: "file.telegram.org",
      }
    ],
  },
};

export default config;
