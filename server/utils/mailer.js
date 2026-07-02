python3 << 'PYEOF'
content = """const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendBookingNotification({ lab_name, user_name, date, start_time, end_time, purpose, recipients }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Mailer] Email not configured — skipping');
    return;
  }

  const formatted_date = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e9e9f0;border-radius:12px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px">
        <h2 style="color:#fff;margin:0;font-size:18px">⚡ LabCommand</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Lab booking notification</p>
      </div>
      <div style="padding:24px 28px;background:#fff">
        <p style="color:#16161f;font-size:15px;margin:0 0 20px">A lab has been booked. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr style="border-bottom:1px solid #f0f0f6">
            <td style="padding:10px 0;color:#7c7c8a;font-weight:500">Lab</td>
            <td style="padding:10px 0;color:#16161f;font-weight:600">${lab_name}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f6">
            <td style="padding:10px 0;color:#7c7c8a;font-weight:500">Booked by</td>
            <td style="padding:10px 0;color:#16161f;font-weight:600">${user_name}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f6">
            <td style="padding:10px 0;color:#7c7c8a;font-weight:500">Date</td>
            <td style="padding:10px 0;color:#16161f;font-weight:600">${formatted_date}</td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f6">
            <td style="padding:10px 0;color:#7c7c8a;font-weight:500">Time</td>
            <td style="padding:10px 0;color:#16161f;font-weight:600">${start_time} – ${end_time}</td>
          </tr>
          ${purpose ? `<tr><td style="padding:10px 0;color:#7c7c8a;font-weight:500">Purpose</td><td style="padding:10px 0;color:#16161f">${purpose}</td></tr>` : ''}
        </table>
        <div style="margin-top:24px;padding:14px 16px;background:#f5f4fe;border-radius:8px;border-left:4px solid #4f46e5">
          <p style="margin:0;font-size:13px;color:#4f46e5;font-weight:500">This is an automated notification from LabCommand.</p>
        </div>
      </div>
      <div style="padding:16px 28px;background:#fafafd;border-top:1px solid #f0f0f6">
        <p style="margin:0;font-size:12px;color:#a8a8b8">LabCommand — AI-Assisted Lab Network Management System</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"LabCommand" <${process.env.EMAIL_USER}>`,
      to: recipients.join(', '),
      subject: `Lab Booked: ${lab_name} on ${formatted_date}`,
      html,
    });
    console.log(`[Mailer] Booking notification sent to ${recipients.length} users`);
  } catch (err) {
    console.error('[Mailer] Failed to send email:', err.message);
  }
}

module.exports = { sendBookingNotification };
"""
open('/Users/noushadrafi/labcommand/server/utils/mailer.js', 'w').write(content)
print("Done")
PYEOF