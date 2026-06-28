import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-055e43670ea7462fb9dfe8e3cb7f222a.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return []
    }

    return [
      {
        source: '/api/:path((?!proxy(?:/|$)|equipments(?:/|$)).*)',
        destination: 'http://127.0.0.1:4000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://127.0.0.1:4000/uploads/:path*',
      },
    ]
  },
}

export default nextConfig
