import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendMail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({ from: `"AI Team Platform" <${process.env.EMAIL_USER}>`, to, subject, html });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error(`Email failed: ${err}`);
  }
};

export const sendWelcomeEmail = (to: string, name: string) =>
  sendMail(to, 'Welcome to AI Team Platform!', `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Welcome, ${name}! 🎉</h2>
      <p>Your account has been created. Start managing your team with AI-powered insights.</p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Go to Dashboard</a>
    </div>`);

export const sendTaskAssignedEmail = (to: string, name: string, taskTitle: string) =>
  sendMail(to, `Task Assigned: ${taskTitle}`, `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Hi ${name},</h2>
      <p>You have been assigned a new task: <strong>${taskTitle}</strong></p>
      <a href="${process.env.CLIENT_URL}/tasks" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">View Task</a>
    </div>`);

export const sendPasswordResetEmail = (to: string, resetToken: string) =>
  sendMail(to, 'Password Reset Request', `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#2563eb">Password Reset</h2>
      <p>Click below to reset your password. Link expires in 1 hour.</p>
      <a href="${process.env.CLIENT_URL}/reset-password/${resetToken}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Reset Password</a>
    </div>`);

export const sendTaskCompletedEmail = (to: string, taskTitle: string, date: string) =>
  sendMail(to, `Task Completed: ${taskTitle}`, `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#16a34a">Task Completed! 🎉</h2>
      <p>The task <strong>${taskTitle}</strong> was successfully marked as completed on ${date}.</p>
      <p>Great job keeping the project moving forward!</p>
    </div>`);

export const sendTaskReminderEmail = (to: string, name: string, taskTitle: string, deadline: string) =>
  sendMail(to, `Reminder: Incomplete Task - ${taskTitle}`, `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <h2 style="color:#f59e0b">Task Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a reminder that the task <strong>${taskTitle}</strong> is still incomplete.</p>
      <p>The deadline is set for <strong>${deadline}</strong>.</p>
      <a href="${process.env.CLIENT_URL}/tasks" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">View Task</a>
    </div>`);
