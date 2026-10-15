import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Enable CORS on all routes
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  next();
});

const TARGET_HOST = 'sachin.studybeepro.site';

// Universal forwarder to upstream sachin.studybeepro.site
function forwardToTarget(targetPath: string, req: Request, res: Response, timeoutMs = 25000) {
  const queryStr = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const fullPath = targetPath + queryStr;

  const reqHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: req.headers.accept || '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `https://${TARGET_HOST}/`,
    Origin: `https://${TARGET_HOST}`,
  };

  if (req.headers.range) {
    reqHeaders['range'] = req.headers.range as string;
  }

  const options: https.RequestOptions = {
    hostname: TARGET_HOST,
    port: 443,
    path: fullPath,
    method: req.method,
    headers: reqHeaders,
    timeout: timeoutMs,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    // Handle redirects from upstream
    if (
      proxyRes.statusCode &&
      proxyRes.statusCode >= 300 &&
      proxyRes.statusCode < 400 &&
      proxyRes.headers.location
    ) {
      return res.redirect(proxyRes.headers.location);
    }

    res.status(proxyRes.statusCode || 200);

    // Forward important streaming and caching headers
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'content-disposition',
    ];

    headersToForward.forEach((h) => {
      if (proxyRes.headers[h]) {
        res.setHeader(h, proxyRes.headers[h] as string);
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');

    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${fullPath}:`, err.message);
    if (!res.headersSent) {
      // Check if this was a subjects request and we have cached data
      if (fullPath.includes('/get/allsubjectfrmlivecourseclass')) {
        const urlObj = new URL(fullPath, 'http://localhost');
        const cid = urlObj.searchParams.get('courseid');
        if (cid) {
          try {
            const cachePath = path.resolve(__dirname, 'src/data/subjects_cache.json');
            if (fs.existsSync(cachePath)) {
              const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
              if (cacheData.subjects && cacheData.subjects[cid]) {
                return res.status(200).json({
                  status: 200,
                  message: 'Loaded from cache',
                  data: cacheData.subjects[cid],
                });
              }
            }
          } catch (e) {
            console.warn('Error reading fallback subjects cache:', e);
          }
        }
      }

      res.status(502).json({
        success: false,
        status: 502,
        message: 'Upstream connection error',
        error: err.message,
      });
    }
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      if (fullPath.includes('/get/allsubjectfrmlivecourseclass')) {
        const urlObj = new URL(fullPath, 'http://localhost');
        const cid = urlObj.searchParams.get('courseid');
        if (cid) {
          try {
            const cachePath = path.resolve(__dirname, 'src/data/subjects_cache.json');
            if (fs.existsSync(cachePath)) {
              const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
              if (cacheData.subjects && cacheData.subjects[cid]) {
                return res.status(200).json({
                  status: 200,
                  message: 'Loaded from cache on timeout',
                  data: cacheData.subjects[cid],
                });
              }
            }
          } catch (e) {
            console.warn('Error reading fallback subjects cache:', e);
          }
        }
      }

      res.status(504).json({
        success: false,
        status: 504,
        message: 'Upstream gateway timeout',
      });
    }
  });

  if (req.body && Object.keys(req.body).length > 0) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
}

// 1. Video Proxy (Handles both .m3u8 playlists and .ts video chunks)
app.use(['/video', '/video/*'], (req: Request, res: Response) => {
  forwardToTarget('/video', req, res, 35000);
});

// 2. PDF Proxy (Decrypts AppX PDFs and streams them)
app.use(['/pdf', '/pdf/*', '/api/pdf'], (req: Request, res: Response) => {
  // If url query is present, forward to upstream /pdf
  forwardToTarget('/pdf', req, res, 30000);
});

// 3. DRM License & MPD Proxies
app.use('/license-proxy', (req: Request, res: Response) => {
  forwardToTarget('/license-proxy', req, res);
});

app.use(['/mpd', '/mpd/*'], (req: Request, res: Response) => {
  forwardToTarget('/mpd', req, res);
});

// 4. API Endpoints (/get/* for subjects, topics, materials, video details)
app.use('/get/*', (req: Request, res: Response) => {
  forwardToTarget(req.baseUrl, req, res, 25000);
});

// 5. Batches JSON
app.get('/batches.json', (req: Request, res: Response) => {
  try {
    const batchesPath = path.resolve(__dirname, 'src/data/batches.json');
    if (fs.existsSync(batchesPath)) {
      const data = fs.readFileSync(batchesPath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      return res.send(data);
    }
    forwardToTarget('/batches.json', req, res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GB STUDY server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
