import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      }
    });
  }
  return transporter;
}

/**
 * Sends a real-time notification email to CKR Technologies upon receipt of an institutional ERP purchase lead.
 */
export async function sendErpLeadNotification(lead) {
  try {
    const mailer = getTransporter();
    const modulesHtml = (Array.isArray(lead.interested_modules) ? lead.interested_modules : [])
      .map(m => `<li style="margin-bottom: 4px; color: #1e293b; font-weight: 600;">${m}</li>`)
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
          .header { background: #064e3b; padding: 24px; color: #ffffff; text-align: left; }
          .content { padding: 28px 24px; }
          .field-label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
          .field-value { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
          .badge { display: inline-block; background-color: #ecfdf5; color: #064e3b; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 800; }
          .btn { display: inline-block; background: #064e3b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 14px; }
          .footer { background: #f8fafc; padding: 16px 24px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 11px; font-weight: 800; color: #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">SchoolKarma Institutional Sales</div>
            <h2 style="margin: 4px 0 0; font-size: 20px; font-weight: 800;">🚀 New School ERP Purchase Lead Received!</h2>
          </div>
          <div class="content">
            <div class="field-label">School / Institution</div>
            <div class="field-value">${lead.school_name} ${lead.city ? `(${lead.city})` : ''}</div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <div class="field-label">Contact Person</div>
                <div class="field-value">${lead.contact_person} ${lead.designation ? `(${lead.designation})` : ''}</div>
              </div>
              <div>
                <div class="field-label">Student Strength</div>
                <div class="field-value"><span class="badge">${lead.student_strength || 'Not specified'}</span></div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <div class="field-label">Direct Phone / WhatsApp</div>
                <div class="field-value"><a href="tel:${lead.phone}" style="color: #064e3b; text-decoration: none;">${lead.phone}</a></div>
              </div>
              <div>
                <div class="field-label">Email Address</div>
                <div class="field-value">${lead.email ? `<a href="mailto:${lead.email}" style="color: #064e3b; text-decoration: none;">${lead.email}</a>` : 'Not provided'}</div>
              </div>
            </div>

            <div class="field-label" style="margin-top: 8px;">Requested Capabilities & Modules</div>
            <ul style="padding-left: 20px; margin-top: 4px; margin-bottom: 20px;">
              ${modulesHtml || '<li>Full Institutional Suite</li>'}
            </ul>

            <div style="text-align: center;">
              <a href="https://schoolkarma.com/superadmin/" class="btn">View Lead in Superadmin Desk →</a>
            </div>
          </div>
          <div class="footer">
            Delivered automatically by SchoolKarma Lead Engine to ${config.smtp.recipient}
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"SchoolKarma Institutional Sales" <${config.smtp.user}>`,
      to: config.smtp.recipient,
      subject: `🎯 New School ERP Lead: ${lead.school_name} (${lead.city || 'India'}) - ${lead.contact_person}`,
      html: htmlContent
    };

    const info = await mailer.sendMail(mailOptions);
    console.log('✅ ERP Lead email notification sent successfully! MessageId:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send ERP lead notification email:', error);
    return null;
  }
}
