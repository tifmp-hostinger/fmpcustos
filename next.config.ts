import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para a imagem Docker enxuta usada no EasyPanel.
  output: "standalone",
  typedRoutes: true,
};

export default nextConfig;
