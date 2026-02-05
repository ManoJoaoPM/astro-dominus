// next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // 🔹 Essencial pro Docker com standalone
  output: "standalone",

  // 🔹 Você já usa isso pro Struct
  transpilePackages: ["@discovery-solutions/struct"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.usercontent.google.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;



// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "*.public.blob.vercel-storage.com",
//       },
//     ],
//   },
//   // async headers() {
//   //   return [
//   //     {
//   //       source: "/api/:path*",
//   //       headers: [
//   //         {
//   //           key: "Access-Control-Allow-Origin",
//   //           value: "*",
//   //         },
//   //         {
//   //           key: "Access-Control-Allow-Credentials",
//   //           value: "true",
//   //         },
//   //         {
//   //           key: "Access-Control-Allow-Methods",
//   //           value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
//   //         },
//   //       ],
//   //     },
//   //   ];
//   // },
// };

// export default nextConfig;
