/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Necessário para o Vercel
  output: "standalone",

  // Imagens externas
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Ignora erros de TypeScript no build (não bloqueia o deploy)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignora erros de ESLint no build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
