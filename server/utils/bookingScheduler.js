const pool = require('../db/connection');
const { sendBookingReminder } = require('./mailer');

const CHECK_INTERVAL = 5 * 60 * 1000; // every 5 minutes
const REMINDER_WINDOW_MINUTES = 30;   // send reminder ~30 min before start
const NO_SHOW_GRACE_MINUTES   = 15;   // mark no-show 15 min after start if never checked in

async function sendDueReminders() {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, l.name as lab_name, u.email as user_email, a.email as assigned_email
       FROM slots s
       JOIN labs l ON s.lab_id = l.id
       JOIN users u ON s.user_id = u.id
       LEFT JOIN users a ON s.assigned_to = a.id
       WHERE s.status = 'booked'
         AND s.reminder_sent = false
         AND (s.date + s.start_time) BETWEEN NOW() AND NOW() + INTERVAL '${REMINDER_WINDOW_MINUTES} minutes'`
    );

    for (const slot of rows) {
      const recipients = [slot.user_email, slot.assigned_email].filter(Boolean);
      if (recipients.length === 0) continue;

      await sendBookingReminder({
        lab_name: slot.lab_name,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        purpose: slot.purpose,
        recipients,
      });

      await pool.query('UPDATE slots SET reminder_sent = true WHERE id = $1', [slot.id]);
    }

    if (rows.length > 0) {
      console.log(`[Scheduler] Sent ${rows.length} booking reminder(s)`);
    }
  } catch (err) {
    console.error('[Scheduler] Reminder check failed:', err.message);
  }
}

async function markNoShows() {
  try {
    const { rows } = await pool.query(
      `UPDATE slots
       SET status = 'no_show'
       WHERE status = 'booked'
         AND (date + start_time) < NOW() - INTERVAL '${NO_SHOW_GRACE_MINUTES} minutes'
       RETURNING id, lab_id`
    );

    if (rows.length > 0) {
      console.log(`[Scheduler] Marked ${rows.length} booking(s) as no-show`);
      if (global.io) {
        rows.forEach(r => global.io.emit('booking:no_show', { slot_id: r.id, lab_id: r.lab_id }));
      }
    }
  } catch (err) {
    console.error('[Scheduler] No-show check failed:', err.message);
  }
}

function startBookingScheduler() {
  console.log(`[Scheduler] Booking scheduler started (checking every ${CHECK_INTERVAL / 60000} min)`);
  setTimeout(() => { sendDueReminders(); markNoShows(); }, 10000);
  setInterval(() => { sendDueReminders(); markNoShows(); }, CHECK_INTERVAL);
}

module.exports = { startBookingScheduler };
