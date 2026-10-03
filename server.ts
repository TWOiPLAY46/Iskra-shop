import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Security Headers Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Image search API
  app.get('/api/search-images', async (req: Request, res: Response) => {
    const rawQuery = (req.query.q as string) || '';
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 50);

    if (!rawQuery.trim() || rawQuery.length > 200) {
      res.json({ results: [] });
      return;
    }

    const cleanQ = rawQuery
      .replace(/\(.*?\)/g, ' ')
      .replace(/[«»"'`]/g, ' ')
      .replace(/\b(шт|пач|уп|м|компл|од|грн|BLOB)\b\.?/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      // 1. Try Bing Images (Exact Query)
      let items = await searchBingImages(cleanQ);

      // 2. If < 4 items, try simplified query
      if (items.length < 4) {
        const simplified = cleanQ
          .replace(/\b(TM|ТМ)\b/gi, '')
          .replace(/\b(круг|квадрат|овал|прямокутний)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (simplified && simplified !== cleanQ) {
          const subItems = await searchBingImages(simplified);
          const seen = new Set(items.map((i) => i.url));
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

      res.json({ results: items.slice(0, limit) });
    } catch (err: any) {
      console.error('API /api/search-images error:', err?.message || err);
      res.json({ results: [], error: String(err?.message || err) });
    }
  });

  // Helper to validate safe external URLs (SSRF prevention)
  function isSafeExternalUrl(inputUrl: string): boolean {
    try {
      const parsed = new URL(inputUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }
      const hostname = parsed.hostname.toLowerCase();
      // Block localhost, private IPs, loopback, metadata services
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === '169.254.169.254' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        /^10\.\d+\.\d+\.\d+$/.test(hostname) ||
        /^192\.168\.\d+\.\d+$/.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // Image proxy API
  app.get('/api/image-proxy', async (req: Request, res: Response) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl || typeof targetUrl !== 'string') {
      res.status(400).send('Missing or invalid url param');
      return;
    }

    if (!isSafeExternalUrl(targetUrl)) {
      res.status(403).send('Forbidden: invalid or non-allowed target URL');
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
        res.status(fetchResp.status).send('Failed to fetch image');
        return;
      }

      const rawContentType = fetchResp.headers.get('content-type') || '';
      // Ensure content type is a valid image or fallback to jpeg
      const isImage = rawContentType.startsWith('image/') || rawContentType.includes('octet-stream');
      const contentType = isImage ? rawContentType.split(';')[0] : 'image/jpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuf = await fetchResp.arrayBuffer();
      res.send(Buffer.from(arrayBuf));
    } catch (err: any) {
      res.status(500).send('Proxy error: ' + err?.message);
    }
  });

  // In development, mount Vite middleware
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer();
