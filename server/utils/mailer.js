const nodemailer = require('nodemailer');
const pool = require('../db/connection');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log('[Mailer] Test email ready:', testAccount.user);
  return transporter;
}

async function sendBookingNotification({ lab_name, user_name, date, start_time, end_time, purpose, recipients }) {
  const t = await getTransporter();
  const formatted_date = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const subject = `Lab Booked: ${lab_name} on ${formatted_date}`;
  const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e9e9f0;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px"><h2 style="color:#fff;margin:0;font-size:20px">LabCommand</h2><p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Lab booking notification</p></div><div style="padding:24px 28px;background:#fff"><p style="color:#333;font-size:14px;margin:0 0 20px">A lab has been booked. Here are the details:</p><table style="width:100%;border-collapse:collapse;font-size:14px"><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888;width:120px">Lab</td><td style="padding:10px 0;font-weight:600;color:#111">${lab_name}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Booked by</td><td style="padding:10px 0;font-weight:600;color:#111">${user_name}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Date</td><td style="padding:10px 0;font-weight:600;color:#111">${formatted_date}</td></tr><tr style="border-bottom:1px solid #f0f0f0"><td style="padding:10px 0;color:#888">Time</td><td style="padding:10px 0;font-weight:600;color:#111">${start_time} to ${end_time}</td></tr>${purpose ? `<tr><td style="padding:10px 0;color:#888">Purpose</td><td style="padding:10px 0;color:#111">${purpose}</td></tr>` : ''}</table><div style="margin-top:20px;padding:12px 16px;background:#f5f4fe;border-radius:8px;border-left:4px solid #4f46e5"><p style="margin:0;font-size:13px;color:#4f46e5;font-weight:500">This is an automated notification from LabCommand.</p></div></div><div style="padding:14px 28px;background:#fafafd;border-top:1px solid #f0f0f6"><p style="margin:0;font-size:12px;color:#aaa">LabCommand — AI-Assisted Lab Network Management System</p></div></div>`;

  try {
    const info = await t.sendMail({
      from: '"LabCommand" <noreply@labcommand.com>',
      to: recipients.join(', '),
      subject,
      html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('[Mailer] Preview URL:', previewUrl);

    await pool.query(
      `INSERT INTO email_log (subject, recipients, lab_name, booked_by, preview_url)
       VALUES ($1, $2, $3, $4, $5)`,
      [subject, recipients.join(', '), lab_name, user_name, previewUrl]
    );
    console.log(`[Mailer] Email sent to ${recipients.length} users and logged to DB`);
  } catch (err) {
    console.error('[Mailer] Failed:', err.message);
  }
}

module.exports = { sendBookingNotification };
