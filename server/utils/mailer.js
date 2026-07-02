const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('[Mailer] Test email ready:', testAccount.user);
  return transporter;
}

async function sendBookingNotification({ lab_name, user_name, date, start_time, end_time, purpose, recipients }) {
  const t = await getTransporter();
  const formatted_date = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;border:1px solid #e9e9f0;border-radius:12px;overflow:hidden"><div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px"><h2 style="color:#fff;margin:0">LabCommand</h2><p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Lab booking notification</p></div><div style="padding:24px 28px"><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:10px 0;color:#7c7c8a">Lab</td><td style="padding:10px 0;font-weight:600">${lab_name}</td></tr><tr><td style="padding:10px 0;color:#7c7c8a">Booked by</td><td style="padding:10px 0;font-weight:600">${user_name}</td></tr><tr><td style="padding:10px 0;color:#7c7c8a">Date</td><td style="padding:10px 0;font-weight:600">${formatted_date}</td></tr><tr><td style="padding:10px 0;color:#7c7c8a">Time</td><td style="padding:10px 0;font-weight:600">${start_time} to ${end_time}</td></tr></table></div></div>`;
  try {
    const info = await t.sendMail({
      from: '"LabCommand" <noreply@labcommand.com>',
      to: recipients.join(', '),
      subject: `Lab Booked: ${lab_name} on ${formatted_date}`,
      html,
    });
    console.log('[Mailer] Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error('[Mailer] Failed:', err.message);
  }
}

module.exports = { sendBookingNotification };
