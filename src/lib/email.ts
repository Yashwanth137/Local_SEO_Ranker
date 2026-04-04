import axios from 'axios';

interface LeadEmailData {
  name: string;
  email: string;
  phone?: string;
  keyword: string;
  location: string;
}

/**
 * Sends an email notification to the admin when a new lead is captured.
 * Uses the Resend API (https://resend.com).
 * Fails silently so the lead capture flow is never interrupted.
 */
export async function sendLeadNotification(lead: LeadEmailData) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendApiKey || !adminEmail) {
    console.warn('[Email] RESEND_API_KEY or ADMIN_EMAIL not configured. Skipping notification.');
    return;
  }

  try {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'Zorvexa Local Ranker <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🔥 New Lead: ${lead.name} — ${lead.keyword} in ${lead.location}`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #0a0a1a; color: #e4e4e7; border-radius: 12px;">
            <h1 style="color: #818cf8; margin-bottom: 4px;">New Lead Captured! 🎯</h1>
            <p style="color: #a1a1aa; margin-top: 0;">A prospect just submitted their info on the Local Ranker tool.</p>
            <hr style="border: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #a1a1aa; width: 120px;">Name</td>
                <td style="padding: 8px 0; font-weight: 600;">${lead.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #a1a1aa;">Email</td>
                <td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #818cf8;">${lead.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #a1a1aa;">Phone</td>
                <td style="padding: 8px 0;">${lead.phone || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #a1a1aa;">Keyword</td>
                <td style="padding: 8px 0; color: #818cf8; font-weight: 600;">${lead.keyword}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #a1a1aa;">Location</td>
                <td style="padding: 8px 0;">${lead.location}</td>
              </tr>
            </table>
            <hr style="border: 1px solid rgba(255,255,255,0.1); margin: 24px 0;" />
            <p style="color: #71717a; font-size: 13px; text-align: center;">This alert was sent automatically by the Zorvexa Local Ranker system.</p>
          </div>
        `
      },
      {
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`[Email] Lead notification sent to ${adminEmail} for lead: ${lead.name}`);
  } catch (err: any) {
    console.error('[Email] Failed to send lead notification:', err.response?.data || err.message);
    // Do NOT throw — we never want email failure to block lead capture
  }
}
