/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["cdn.dribbble.com"], // Add the external image domain here
  },
  async rewrites() {
    return [
      {
        // First-party analytics proxy. Adblockers (Brave Shields / uBlock) block
        // THIRD-PARTY beacons — to app.pretasystems.com and even to the loader's own
        // workers.dev domain — with ERR_BLOCKED_BY_CLIENT. They cannot block a
        // SAME-ORIGIN request without breaking the site. So the loader beacons to
        // /px/* (first-party to THIS site, set via data-api="/px") and Vercel forwards
        // it server-side to the Preta dashboard API, where no adblocker is involved.
        // The only method that reliably captures analytics on Brave/hardened browsers.
        source: "/px/:path*",
        destination: "https://app.pretasystems.com/v2/api/:path*",
      },
    ];
  },
};

export default nextConfig;
