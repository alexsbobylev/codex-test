import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_TO
} = process.env;

let transporter;

export function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT ? Number(EMAIL_PORT) : 587,
    secure: EMAIL_PORT ? Number(EMAIL_PORT) === 465 : false,
    auth: EMAIL_USER && EMAIL_PASS ? { user: EMAIL_USER, pass: EMAIL_PASS } : undefined
  });

  return transporter;
}

export async function sendReminderEmail(subscription) {
  if (!EMAIL_TO) {
    console.warn('EMAIL_TO is not set. Skipping email notification.');
    return;
  }

  const transport = getTransporter();
  const message = {
    from: EMAIL_FROM || EMAIL_USER,
    to: EMAIL_TO,
    subject: `Скоро списание по подписке ${subscription.service_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Напоминание о подписке на ${subscription.service_name}</h2>
        <p>План: <strong>${subscription.plan_name || '—'}</strong></p>
        <p>Стоимость: <strong>${subscription.price.toFixed(2)} ${subscription.currency}</strong></p>
        <p>Дата следующего списания: <strong>${new Date(subscription.next_billing_date).toLocaleDateString()}</strong></p>
        <p>${subscription.notes || ''}</p>
        <p>Пожалуйста, убедитесь, что у вас достаточно средств к этой дате.</p>
      </div>
    `
  };

  await transport.sendMail(message);
}
