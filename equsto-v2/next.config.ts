import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/pfos", destination: "/pfos.html" },
      { source: "/pfos/", destination: "/pfos.html" },
      { source: "/besos", destination: "/besos/index.html" },
      { source: "/besos/", destination: "/besos/index.html" },
      { source: "/bar-design", destination: "/bar-design.html" },
      { source: "/bar-design/", destination: "/bar-design.html" },
      { source: "/admin", destination: "/admin.html" },
      { source: "/admin/", destination: "/admin.html" },
      { source: "/contact", destination: "/contact.html" },
      { source: "/contact/", destination: "/contact.html" },
    ];
  },
};

export default nextConfig;
