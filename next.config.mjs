/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
  unoptimized: true, // sabse simple fix
  // ya specific domains:
  remotePatterns: [
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "8000",
      pathname: "/media/**",
    },
    {
      protocol: "https",
      hostname: "classroom.onrender.com",
      port: "",
      pathname: "/media/**",
    },
  ],
}
};

export default nextConfig;
