import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { toolsList } from './src/data/tools.js'

const SITE_URL = 'https://audiobulk.com'

// Cross-origin isolation headers. ffmpeg.wasm needs these, and they must match
// vercel.json so `vite dev` and `vite preview` behave like production.
const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'credentialless',
}

// Generate sitemap.xml from the same tool list the router and UI use, so it can
// never drift out of sync with the actual set of pages.
function sitemapPlugin() {
  return {
    name: 'audiobulk-sitemap',
    apply: 'build',
    generateBundle() {
      const staticPaths = ['/', '/all-tools', '/privacy', '/terms']
      const paths = [...staticPaths, ...toolsList.map((tool) => tool.path)]
      const lastmod = new Date().toISOString().slice(0, 10)

      const urls = paths
        .map((path) => {
          const priority = path === '/' ? '1.0' : path === '/all-tools' ? '0.9' : '0.8'
          return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
        })
        .join('\n')

      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sitemapPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'AudioBulk Tools',
        short_name: 'AudioBulk',
        description: '70+ Free Browser-Based Tools for Creators',
        theme_color: '#060e20',
        background_color: '#060e20',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 9000,
    headers: crossOriginIsolationHeaders,
  },
  preview: {
    port: 4173,
    headers: crossOriginIsolationHeaders,
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('jszip') || id.includes('file-saver')) {
              return 'vendor-zip';
            }
            if (id.includes('@ffmpeg')) {
              return 'vendor-ffmpeg';
            }
            return 'vendor-others';
          }
        }
      }
    }
  }
})
