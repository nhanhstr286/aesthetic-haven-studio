/**
 * Vercel Serverless Function: /api/lead-capture
 * Receives: { name, email, niche, source }
 * Forwards to Google Sheets via Webhook or Google Sheets API
 */

module.exports = async (req, res) => {
  // 1. Enable CORS for landing page
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, niche, source } = body;

    // 2. Validate input fields
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address format.' });
    }

    const cleanName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'Guest';
    const cleanNiche = (niche && typeof niche === 'string' && niche.trim()) ? niche.trim() : 'General Living';
    const cleanSource = (source && typeof source === 'string' && source.trim()) ? source.trim() : 'pinterest';
    const timestamp = new Date().toISOString();
    const status = 'Gift_Sent';

    const giftMap = {
      'Room Decor & Lighting': {
        title: 'The Warm Minimalist Lighting & Sanctuary Guide',
        link: 'https://agentwell.agency#decor'
      },
      'Smart Kitchen Finds': {
        title: 'Smart Countertop Organization Cheatsheet',
        link: 'https://agentwell.agency#kitchen'
      },
      'Digital Planners & iPad': {
        title: 'Mindful Weekly Planner Sample (GoodNotes/PDF)',
        link: 'https://agentwell.agency#planners'
      },
      'Printable Wall Art': {
        title: 'Neutral Botanical Art Print (300 DPI High-Res)',
        link: 'https://agentwell.agency#wallart'
      }
    };

    const gift = giftMap[cleanNiche] || {
      title: 'Aesthetic Haven Studio Welcome Guide',
      link: 'https://agentwell.agency'
    };

    const nurtureStatus = 'Pending_Day2';

    const leadRecord = {
      timestamp,
      name: cleanName,
      email: cleanEmail,
      niche: cleanNiche,
      source: cleanSource,
      status,
      nurtureStatus,
      giftTitle: gift.title,
      giftLink: gift.link
    };

    console.log('[Lead Capture API] New lead received:', JSON.stringify(leadRecord));

    // 3. Forward to Google Sheets Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    let sheetSynced = false;

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(leadRecord),
          redirect: 'follow'
        });

        if (response.ok) {
          sheetSynced = true;
          console.log('[Lead Capture API] Successfully pushed lead to Google Sheets Webhook.');
        } else {
          console.warn('[Lead Capture API] Google Sheet Webhook returned status:', response.status);
        }
      } catch (webhookErr) {
        console.error('[Lead Capture API] Error calling Google Sheets Webhook:', webhookErr.message);
      }
    } else {
      console.log('[Lead Capture API] GOOGLE_SHEET_WEBHOOK_URL not configured. Lead recorded in serverless logs.');
    }

    // 4. Return success response to frontend
    return res.status(200).json({
      success: true,
      message: 'Thank you! Your guide is on its way.',
      sheetSynced,
      lead: {
        name: cleanName,
        email: cleanEmail,
        niche: cleanNiche,
        source: cleanSource,
        status,
        nurtureStatus,
        giftTitle: gift.title,
        giftLink: gift.link,
        timestamp
      }
    });

  } catch (error) {
    console.error('[Lead Capture API] Internal error:', error);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your request.'
    });
  }
};
