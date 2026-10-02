import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

interface SearchResultItem {
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

/**
 * Robust Bing Image Search Scraper
 */
async function searchBingImages(query: string): Promise<SearchResultItem[]> {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&FORM=HDRSC2`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.7'
    },
    signal: AbortSignal.timeout(6000)
  });

  if (!resp.ok) return [];
  const html = await resp.text();
  const results: SearchResultItem[] = [];
  const seen = new Set<string>();

  // 1. Primary extractor: class="iusc" with JSON m attribute
  const itemRegex = /class=\"iusc\"[^>]*m=\"([^\"]+)\"/g;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(html)) !== null) {
    try {
      const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const obj = JSON.parse(decoded);
      if (obj.murl && !seen.has(obj.murl)) {
        seen.add(obj.murl);
        results.push({
          url: obj.murl,
          thumbnail: obj.turl || obj.murl,
          title: (obj.t ? obj.t.replace(/<[^>]*>/g, '') : query).trim(),
          source: obj.pub ? obj.pub : 'Інтернет'
        });
      }
    } catch {}
  }

  // 2. Secondary extractor: direct murl regex in html
  if (results.length === 0) {
    const murlRegex = /murl&quot;:&quot;(https?:[^&]+)&quot;.*?turl&quot;:&quot;(https?:[^&]+)&quot;.*?t&quot;:&quot;([^&]*)&quot;/g;
    let m2: RegExpExecArray | null;
    while ((m2 = murlRegex.exec(html)) !== null) {
      try {
        const murl = decodeURIComponent(m2[1]);
        if (!seen.has(murl)) {
          seen.add(murl);
          results.push({
            url: murl,
            thumbnail: decodeURIComponent(m2[2]),
            title: m2[3] ? decodeURIComponent(m2[3]).replace(/<[^>]*>/g, '').trim() : query,
            source: 'Інтернет'
          });
        }
      } catch {}
    }
  }

  return results;
}

/**
 * Fallback DuckDuckGo Image Search
 */
async function searchDuckDuckGoImages(query: string): Promise<SearchResultItem[]> {
  try {
    const tokenResp = await fetch('https://duckduckgo.com/?q=' + encodeURIComponent(query), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,ru;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(5000)
    });
    const html = await tokenResp.text();
    const match = html.match(/vqd=([0-9-]+)/) || html.match(/vqd=([\"'])(.*?)\1/);
    if (!match) return [];
    const vqd = match[0].replace(/vqd=[\"']?/, '').replace(/[\"']$/, '');
    const imgUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;
    const imgResp = await fetch(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!imgResp.ok) return [];
    const data = await imgResp.json();
    return (data.results || []).map((r: any) => ({
      url: r.image || r.thumbnail,
      thumbnail: r.thumbnail || r.image,
      title: (r.title || query).replace(/<[^>]*>/g, '').trim(),
      source: r.source || 'Інтернет'
    }));
  } catch {
    return [];
  }
}

function imageSearchPlugin(): Plugin {
  return {
    name: 'image-search-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        
        if (url.pathname === '/api/search-images') {
          const rawQuery = url.searchParams.get('q') || '';
          const limit = parseInt(url.searchParams.get('limit') || '20', 10);

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
            // 1. First attempt with Bing Image engine (Exact query)
            let items = await searchBingImages(cleanQ);

            // 2. If < 4 items, try simplified query (remove TM, common filler words)
            if (items.length < 4) {
              const simplified = cleanQ
                .replace(/\b(TM|ТМ)\b/gi, '')
                .replace(/\b(круг|квадрат|овал|прямокутний)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
              if (simplified && simplified !== cleanQ) {
                const subItems = await searchBingImages(simplified);
                const seen = new Set(items.map(i => i.url));
                for (const si of subItems) {
                  if (!seen.has(si.url)) {
                    seen.add(si.url);
                    items.push(si);
                  }
                }
              }
            }

            // 3. If still empty, try DuckDuckGo
            if (items.length === 0) {
              items = await searchDuckDuckGoImages(cleanQ);
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
