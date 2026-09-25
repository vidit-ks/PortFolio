// VIDIT UNIVERSE — Production Vercel Serverless & Local HTTP Engine
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env locally if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length > 0) {
        const val = values.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = val;
      }
    }
  });
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'kumarvidit69@gmail.com';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf'
};

// Unified Request Handler (Works for both Vercel Serverless and Local Node HTTP)
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname;

  // POST /api/contact or /api/send-message
  if (req.method === 'POST' && (pathname === '/api/contact' || pathname === '/api/send-message')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB limit
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const { name, email, message } = data;

        if (!name || !email || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'All fields (name, email, message) are required.'
          }));
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid email address.'
          }));
          return;
        }

        if (RESEND_API_KEY && RESEND_API_KEY.trim() !== '') {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'VIDIT UNIVERSE <onboarding@resend.dev>',
              to: [CONTACT_EMAIL],
              reply_to: email,
              subject: `Transmission from ${name} [VIDIT UNIVERSE]`,
              text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070913; color: #f8fafc; padding: 28px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2);">
                  <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px;">// INCOMING TRANSMISSION — VIDIT UNIVERSE</h2>
                  <div style="margin: 18px 0; padding: 14px; background: rgba(255, 255, 255, 0.04); border-radius: 8px;">
                    <p style="margin: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Sender Name:</strong> <span style="color: #f8fafc;">${name}</span></p>
                    <p style="margin: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #38bdf8;">${email}</a></p>
                  </div>
                  <div style="margin-top: 16px; padding: 16px; background: rgba(56, 189, 248, 0.05); border-left: 3px solid #38bdf8; border-radius: 4px;">
                    <p style="white-space: pre-wrap; margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0;">${message}</p>
                  </div>
                </div>
              `
            })
          });

          const result = await response.json();
          if (!response.ok) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: result.message || 'Failed to dispatch email.'
            }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Transmission dispatched successfully to Vidit Kumar Singh.'
          }));
          return;
        }

        // Demo feedback mode if API key not set
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Transmission logged in buffer (Configure RESEND_API_KEY in Vercel to receive emails).'
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: err.message || 'Internal server error.'
        }));
      }
    });
    return;
  }

  // Static Asset Serving
  const cleanPath = pathname.split('?')[0];
  let relativePath = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\//, '');
  let filePath = path.join(__dirname, relativePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const fileContent = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(fileContent);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

// Local Server Activation (Ignored on Vercel Serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5188;
  const server = http.createServer(handler);
  server.listen(PORT, () => {
    console.log(`🌌 VIDIT UNIVERSE running at http://localhost:${PORT}`);
  });
}
