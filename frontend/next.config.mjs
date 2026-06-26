import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(__dirname, '..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: workspaceRoot,
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
