import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function imageSearchPlugin(): Plugin {
  return {
    name: 'image-search-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        
        if (url.pathname === '/api/search-images') {
          const rawQuery = url.searchParams.get('q') || '';
          const limit = parseInt(url.searchParams.get('limit') || '16', 10);

          if (!rawQuery.trim()) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [] }));
            return;
          }

          const cleanQ = rawQuery
            .replace(/\(.*?\)/g, ' ')
            .replace(/[«»"'`]/g, ' ')
            .replace(/\b(шт|пач|уп|м|компл|од|грн|BLOB)\b\.?/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          try {
            // 1. Query DuckDuckGo Images
            const tokenResp = await fetch('https://duckduckgo.com/?q=' + encodeURIComponent(cleanQ), {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.7'
              },
              signal: AbortSignal.timeout(6000)
            });

            const html = await tokenResp.text();
            const match = html.match(/vqd=([0-9-]+)/) || html.match(/vqd=([\"'])(.*?)\1/);
            
            let items: any[] = [];
            if (match) {
              const vqd = match[0].replace(/vqd=[\"']?/, '').replace(/[\"']$/, '');
              const imgUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(cleanQ)}&vqd=${vqd}&f=,,,&p=1`;
              const imgResp = await fetch(imgUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(6000)
              });

              if (imgResp.ok) {
                const data = await imgResp.json();
                items = (data.results || []).map((r: any) => ({
                  url: r.image || r.thumbnail,
                  thumbnail: r.thumbnail || r.image,
                  title: (r.title || cleanQ).replace(/<[^>]*>/g, '').trim(),
                  source: r.source || 'Інтернет'
                }));
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: items.slice(0, limit) }));
          } catch (err: any) {
            console.error('API /api/search-images error:', err?.message || err);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [], error: String(err) }));
          }
          return;
        }

        if (url.pathname === '/api/image-proxy') {
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }

          try {
            const fetchResp = await fetch(targetUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': ''
              },
              signal: AbortSignal.timeout(8000)
            });

            if (!fetchResp.ok) {
              res.statusCode = fetchResp.status;
              res.end('Failed to fetch upstream image');
              return;
            }

            const contentType = fetchResp.headers.get('content-type') || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            
            const arrayBuf = await fetchResp.arrayBuffer();
            res.end(Buffer.from(arrayBuf));
          } catch (err: any) {
            res.statusCode = 500;
            res.end('Proxy error: ' + err?.message);
          }
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [imageSearchPlugin(), react(), tailwindcss()],
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
