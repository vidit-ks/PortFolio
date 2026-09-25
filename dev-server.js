// VIDIT UNIVERSE — Production Backend Server & Resend API Route
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if present
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

const PORT = process.env.PORT || 5188;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'kumarvidit69@gmail.com';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer(async (req, res) => {
  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid email address.'
          }));
          return;
        }

        // If Resend API key is configured, send email via Resend REST API
        if (RESEND_API_KEY && RESEND_API_KEY.trim() !== '') {
          const emailPayload = {
            from: 'VIDIT UNIVERSE <onboarding@resend.dev>',
            to: [CONTACT_EMAIL],
            reply_to: email,
            subject: `New message from VIDIT UNIVERSE - ${name}`,
            text: `New message from VIDIT UNIVERSE\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030407; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-size: 11px; letter-spacing: 2px; color: #06b6d4; text-transform: uppercase; margin-bottom: 8px;">// SECURE SATELLITE UPLINK</div>
                <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">New Message from VIDIT UNIVERSE</h2>
                <div style="background: rgba(255,255,255,0.04); padding: 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 20px;">
                  <p style="margin: 0 0 10px 0; font-size: 14px;"><strong style="color: #a855f7;">Name:</strong> ${name}</p>
                  <p style="margin: 0; font-size: 14px;"><strong style="color: #a855f7;">Email:</strong> <a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></p>
                </div>
                <div style="font-size: 11px; letter-spacing: 1.5px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">// MESSAGE PAYLOAD</div>
                <div style="background: rgba(10,12,18,0.8); padding: 20px; border-radius: 10px; border-left: 3px solid #06b6d4; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap;">${message}</div>
                <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px;">Sent securely from VIDIT UNIVERSE Interactive Portfolio</p>
              </div>
            `
          };

          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
          });

          const resendData = await resendResponse.json();

          if (!resendResponse.ok) {
            console.error('[Resend Error]', resendData);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: resendData.message || 'Failed to transmit message via Resend.'
            }));
            return;
          }

          console.log(`[Satellite Comms] Message successfully sent from ${name} (${email}) to ${CONTACT_EMAIL}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Transmission received successfully.',
            id: resendData.id
          }));
        } else {
          // No RESEND_API_KEY configured
          console.warn('[Satellite Comms] RESEND_API_KEY is not configured in .env. Returning error to ensure authentic feedback.');
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Email gateway is offline (RESEND_API_KEY not configured in .env). Please reach out to kumarvidit69@gmail.com directly.'
          }));
        }
      } catch (err) {
        console.error('[Server Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Internal server error while processing transmission.'
        }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(__dirname, 'index.html');
    }

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`[VIDIT UNIVERSE] Console active at http://localhost:${PORT}`);
  console.log(`[Satellite Gateway] Target: ${CONTACT_EMAIL}`);
  if (!RESEND_API_KEY) {
    console.log(`[Satellite Gateway Note] Add RESEND_API_KEY in .env to activate live dispatch.`);
  }
});
