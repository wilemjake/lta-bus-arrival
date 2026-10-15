import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'serverless-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url) return next();
            const url = new URL(req.url, 'http://localhost');
            if (url.pathname === '/api/health') {
              try {
                const { default: handler } = await import('./api/health.ts');
                await handler(req, res);
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(err) }));
              }
              return;
            }
            if (url.pathname === '/api/busarrival') {
              try {
                const { default: handler } = await import('./api/busarrival.ts');
                await handler(req, res);
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(err) }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
