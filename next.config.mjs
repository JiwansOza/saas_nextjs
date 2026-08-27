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
      {
        // First-party LOADER delivery, for two reasons that are really one.
        //
        // 1. THE HANDSHAKE. Measured on a cold visit to this site, /boot's time broke down as
        //    ~74-155ms before the parser even reached its tag, 240-272ms WAITING FOR THE TCP+TLS
        //    HANDSHAKE, and 207-259ms of server and network once the request was finally sent.
        //    The handshake was the single largest piece, and it existed only because the loader
        //    was a different origin. Through this rewrite there is no new connection at all —
        //    this page's own connection is already open. (The <link rel="preconnect"> that used
        //    to cover this is gone from layout.js; it has nothing left to warm.)
        //
        // 2. THE COOKIE. A third-party host never receives `preta_ctx`, so /boot could not know
        //    who the visitor was, and its response is shared between visitors anyway. That is why
        //    a signed-in visitor's first paint always had to wait for /evaluate. Same-origin, the
        //    cookie arrives, the worker verifies it against the tenant's public key, and answers
        //    for this person — marking that response `private` so it is never shared.
        //
        // The worker builds its own asset URLs (/c/, /pt/, /l/) from the script's src, so they
        // stay on this origin automatically and need no entry here beyond the wildcard.
        source: "/preta/:path*",
        destination: "https://loader-v1.pretasystems.com/:path*",
      },
    ];
  },
};

export default nextConfig;
