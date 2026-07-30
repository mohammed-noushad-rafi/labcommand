const pool = require('../db/connection');

// Railway blocks outbound SMTP ports entirely (confirmed via repeated
// "Connection timeout" even after forcing IPv4 DNS resolution — the port
// itself is closed, not a DNS/routing issue). Brevo's HTTP API sends email
// over plain HTTPS (port 443), which is never blocked, so this sidesteps
// the problem completely instead of fighting SMTP connectivity further.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendViaBrevo({ to, subject, html }) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'LabCommand', email: process.env.EMAIL_USER },
      to: to.map(email => ({ email })),
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Brevo API error (${response.status})`);
  }
  return response.json();
}

async function sendBookingNotification({ lab_name, user_name, date, start_time, end_time, purpose, assigned_to, recipients }) {
  const formatted_date = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const subject = `Lab Booked: ${lab_name} on ${formatted_date}`;
  const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e9e9f0;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px"><h2 style="color:#fff;margin:0;font-size:20px">LabCommand</h2><p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Lab booking notification</p></div><div style="padding:24px 28px;background:#fff"><p style="color:#333;font-size:14px;margin:0 0 20px">A lab has been booked. Here are the details:</p><table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888;width:120px">Lab</td><td style="padding:10px 0;font-weight:600;color:#111">${lab_name}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Booked by</td><td style="padding:10px 0;font-weight:600;color:#111">${user_name}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Date</td><td style="padding:10px 0;font-weight:600;color:#111">${formatted_date}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Time</td><td style="padding:10px 0;font-weight:600;color:#111">${start_time} to ${end_time}</td></tr>${purpose ? `<tr><td style="padding:10px 0;color:#888">Purpose</td><td style="padding:10px 0;color:#111">${purpose}</td></tr>` : ''}</table><div style="margin-top:20px;padding:12px 16px;background:#f5f4fe;border-radius:8px;border-left:4px solid #4f46e5"><p style="margin:0;font-size:13px;color:#4f46e5;font-weight:500">This is an automated notification from LabCommand.</p></div></div><div style="padding:14px 28px;background:#fafafd;border-top:1px solid #f0f0f6"><p style="margin:0;font-size:12px;color:#aaa">LabCommand — AI-Assisted Lab Network Management System</p></div></div>`;

  try {
    await sendViaBrevo({ to: recipients, subject, html });
    await pool.query(
      `INSERT INTO email_log (subject, recipients, lab_name, booked_by, preview_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [subject, recipients.join(', '), lab_name, user_name, null]
    );
    console.log('[Mailer] Real email sent to', recipients.length, 'recipients');
  } catch (err) {
    console.error('[Mailer] Failed:', err.message);
  }
}

async function sendWelcomeEmail({ name, email, password, role, department }) {
  // CLIENT_URL may be a comma-separated list (see server/index.js CORS setup);
  // use the first one as the canonical link in emails.
  const loginUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
  const deptText = department ? ` (${department} Department)` : '';
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e9e9f0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px">
        <h2 style="color:#fff;margin:0;font-size:20px">LabCommand</h2>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Your account has been created</p>
      </div>
      <div style="padding:24px 28px;background:#fff">
        <p style="color:#333;font-size:14px;margin:0 0 20px">Hi <strong>${name}</strong>, welcome to LabCommand!</p>
        <p style="color:#555;font-size:13px;margin:0 0 20px">Your account has been set up. Here are your login credentials:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:10px 0;color:#888;width:120px">Name</td>
            <td style="padding:10px 0;font-weight:600;color:#111">${name}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:10px 0;color:#888">Email</td>
            <td style="padding:10px 0;font-weight:600;color:#111">${email}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:10px 0;color:#888">Password</td>
            <td style="padding:10px 0;font-weight:600;color:#4f46e5;font-size:16px;letter-spacing:1px">${password}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:10px 0;color:#888">Role</td>
            <td style="padding:10px 0;font-weight:600;color:#111">${roleLabel}${deptText}</td>
          </tr>
        </table>
        <div style="margin-top:20px;padding:12px 16px;background:#f5f4fe;border-radius:8px;border-left:4px solid #4f46e5">
          <p style="margin:0;font-size:13px;color:#4f46e5;font-weight:500">
            Login at: <a href="${loginUrl}" style="color:#4f46e5">LabCommand Portal</a>
          </p>
          <p style="margin:6px 0 0;font-size:12px;color:#7c7c8a">
            For your security, please <a href="${loginUrl}/change-password" style="color:#4f46e5">change your password</a> after logging in for the first time.
          </p>
        </div>
      </div>
      <div style="padding:14px 28px;background:#fafafd;border-top:1px solid #f0f0f6">
        <p style="margin:0;font-size:12px;color:#aaa">LabCommand — AI-Assisted Lab Network Management System</p>
      </div>
    </div>`;

  try {
    await sendViaBrevo({ to: [email], subject: 'Welcome to LabCommand — Your Login Credentials', html });
    console.log('[Mailer] Welcome email sent to', email);
  } catch (err) {
    console.error('[Mailer] Welcome email failed:', err.message);
  }
}

async function sendBookingReminder({ lab_name, date, start_time, end_time, purpose, recipients }) {
  const formatted_date = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const subject = `Reminder: ${lab_name} session starts soon`;
  const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e9e9f0;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:24px 28px"><h2 style="color:#fff;margin:0;font-size:20px">LabCommand</h2><p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Your session starts soon</p></div><div style="padding:24px 28px;background:#fff"><p style="color:#333;font-size:14px;margin:0 0 20px">This is a reminder that your lab session starts in about 30 minutes:</p><table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888;width:120px">Lab</td><td style="padding:10px 0;font-weight:600;color:#111">${lab_name}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Date</td><td style="padding:10px 0;font-weight:600;color:#111">${formatted_date}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Time</td><td style="padding:10px 0;font-weight:600;color:#111">${start_time} to ${end_time}</td></tr>${purpose ? `<tr><td style="padding:10px 0;color:#888">Purpose</td><td style="padding:10px 0;color:#111">${purpose}</td></tr>` : ''}</table><div style="margin-top:20px;padding:12px 16px;background:#fffbeb;border-radius:8px;border-left:4px solid #d97706"><p style="margin:0;font-size:13px;color:#d97706;font-weight:500">Please arrive on time — unattended bookings may be automatically released.</p></div></div><div style="padding:14px 28px;background:#fafafd;border-top:1px solid #f0f0f6"><p style="margin:0;font-size:12px;color:#aaa">LabCommand — AI-Assisted Lab Network Management System</p></div></div>`;

  try {
    await sendViaBrevo({ to: recipients, subject, html });
    console.log('[Mailer] Reminder email sent to', recipients.length, 'recipients');
  } catch (err) {
    console.error('[Mailer] Reminder email failed:', err.message);
  }
}

module.exports = { sendBookingNotification, sendWelcomeEmail, sendBookingReminder };