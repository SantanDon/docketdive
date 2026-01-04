/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Optimize for serverless
  experimental: {
    serverMinification: true,
  },
  // Reduce bundle size for faster cold starts
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
};

export default nextConfig;
