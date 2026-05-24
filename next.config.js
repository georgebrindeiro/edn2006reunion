/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google Photos thumbnails
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh", // Uploadthing CDN (new domain)
      },
    ],
  },
};

module.exports = nextConfig;
