// Vercel Serverless Function: /api/contact
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // Keep as is
      }
    }

    const { name, email, message } = body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields (name, email, message) are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address.'
      });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'kumarvidit69@gmail.com';

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
              <h2 style="color: #38bdf8; margin-top: 0; font-size: 20px; letter-spacing: 0.05em;">// INCOMING TRANSMISSION — VIDIT UNIVERSE</h2>
              <div style="margin: 18px 0; padding: 14px; background: rgba(255, 255, 255, 0.04); border-radius: 8px;">
                <p style="margin: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Sender Name:</strong> <span style="color: #f8fafc;">${name}</span></p>
                <p style="margin: 6px 0; color: #94a3b8; font-size: 14px;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #38bdf8; text-decoration: none;">${email}</a></p>
              </div>
              <div style="margin-top: 16px; padding: 16px; background: rgba(56, 189, 248, 0.05); border-left: 3px solid #38bdf8; border-radius: 4px;">
                <p style="white-space: pre-wrap; margin: 0; font-size: 14px; line-height: 1.6; color: #e2e8f0;">${message}</p>
              </div>
              <p style="margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 12px;">Dispatched via Communication Satellite • VIDIT UNIVERSE</p>
            </div>
          `
        })
      });

      const result = await response.json();
      if (!response.ok) {
        return res.status(500).json({
          success: false,
          error: result.message || 'Failed to dispatch email via Resend.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Packet dispatched successfully to Vidit Kumar Singh.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transmission logged in buffer (Add RESEND_API_KEY in Vercel to receive real emails).'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error.'
    });
  }
}
