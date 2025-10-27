import cron from 'node-cron';
import { findUpcomingSubscriptions } from './db.js';
import { sendReminderEmail } from './email.js';

const UPCOMING_DAYS = 3;

async function sendUpcomingReminders() {
  const subscriptions = findUpcomingSubscriptions(UPCOMING_DAYS);
  for (const sub of subscriptions) {
    try {
      await sendReminderEmail(sub);
      console.log(`Reminder sent for subscription ${sub.service_name}`);
    } catch (error) {
      console.error('Failed to send reminder email', error);
    }
  }
}

export function startScheduler() {
  cron.schedule('0 8 * * *', sendUpcomingReminders, {
    timezone: 'Europe/Moscow'
  });
  console.log('Scheduler started. Daily reminders at 08:00 Europe/Moscow.');
}

export { sendUpcomingReminders };
