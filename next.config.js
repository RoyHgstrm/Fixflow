/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve('./src');
    
    // Add configuration to resolve duplicate module imports
    config.resolve.fallback = { fs: false, net: false, tls: false };
    
    if (!isServer) {
      config.resolve.alias['next/navigation'] = path.resolve('./node_modules/next/navigation.js');
    }
    
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add other Next.js configurations here
};

export default nextConfig;
