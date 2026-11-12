import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'framer-motion',
        'motion',
        'firebase',
        'firebase/app',
        'firebase/firestore',
        '@firebase/app',
        '@firebase/firestore',
        '@firebase/component',
      ],
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'framer-motion': path.resolve(__dirname, 'node_modules/motion/node_modules/framer-motion'),
        'recharts': path.resolve(__dirname, 'src/components/RechartsShim.tsx'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/client',
        'lucide-react',
        'motion/react',
        'framer-motion',
        'd3',
        'xlsx',
        'jspdf',
        'jspdf-autotable',
        'jszip',
        'qrcode',
        'react-markdown',
        'firebase/app',
        'firebase/firestore',
      ],
    },
    server: {
      host: true,
      allowedHosts: true as true,
      // Completely disable HMR on the client and server side to suppress WebSocket connection errors
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Heavy app modules that are only needed on demand (PDF/QR/ZIP tooling).
            // Without this, Rollup hoists them into the entry chunk because many lazy
            // views import them, forcing every visitor to download jspdf + jszip.
            if (id.includes('/src/services/pdfService') || id.includes('/src/services/qrService')) {
              return 'pdf-tools';
            }
            // Eager stores/data share one chunk so the heavy services above are never
            // pulled back into the entry chunk. Heavy services keep their own chunks.
            if (id.includes('/src/services/') || id.includes('/src/data/')) {
              if (
                id.includes('excelService') ||
                id.includes('archiveBackupService') ||
                id.includes('firebaseService') ||
                id.includes('/src/firebase.ts')
              ) {
                return;
              }
              return 'app-core';
            }
            if (id.includes('node_modules')) {
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
              if (id.includes('firebase')) return 'vendor-firebase';
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('jspdf-autotable')) return 'vendor-pdf';
              if (id.includes('xlsx')) return 'vendor-xlsx';
              if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
              if (id.includes('qrcode') || id.includes('dijkstrajs')) return 'vendor-qrcode';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('motion')) return 'vendor-motion';
            }
          },
        },
      },
    },
  };
});
