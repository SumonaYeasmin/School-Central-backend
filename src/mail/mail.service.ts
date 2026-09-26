// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * 1. টিচারের কাছে ক্রেডেনশিয়াল ইমেইল পাঠানো
   */
  async sendTeacherCredentials(
    toEmail: string,
    teacherName: string,
    temporaryPassword: string,
    teacherId: string,
  ) {
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Greenfield High School</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">School Central Management Portal</p>
        </div>

        <div style="padding: 30px 25px; color: #334155;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Welcome, ${teacherName}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            You have been registered as a Faculty Teacher. Below are your secure login credentials to access the Teacher Portal:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Portal URL:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">http://localhost:3000/login</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Teacher ID:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${teacherId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Login Email:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${toEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Temporary Password:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #16a34a; font-size: 16px;">${temporaryPassword}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; display: inline-block;">
              Sign In to Faculty Portal &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-bottom: 0;">
            Security Notice: Please do not share this password with anyone. You can change your password anytime after logging in.
          </p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"School Central" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your Teacher Portal Credentials - Greenfield High School`,
        html: htmlContent,
      });
      this.logger.log(`Credential email sent successfully to ${toEmail} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${toEmail}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * 2. অভিভাবকদের কাছে ক্রেডেনশিয়াল ইমেইল পাঠানো
   */
  async sendParentCredentials(
    toEmail: string,
    parentName: string,
    temporaryPassword: string,
    studentName?: string,
    studentRoll?: string,
  ) {
    const studentInfo = studentName
      ? `to monitor academic progress, results, and routines for your child <strong>${studentName}${studentRoll ? ` (Roll: ${studentRoll})` : ''}</strong>.`
      : `to monitor academic progress, class routines, and exam results for your child.`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #0d9488, #14b8a6); padding: 30px 20px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Greenfield High School</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Parent Portal Access</p>
        </div>

        <div style="padding: 30px 25px; color: #334155;">
          <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Dear ${parentName},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            Your account has been created on the Greenfield High School portal ${studentInfo}
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;">Portal URL:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0d9488;">http://localhost:3000/login</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Login Email:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${toEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Temporary Password:</td>
                <td style="padding: 6px 0; font-weight: 800; color: #0d9488; font-size: 16px;">${temporaryPassword}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login" style="background-color: #0d9488; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; display: inline-block;">
              Sign In to Parent Portal &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-bottom: 0;">
            Security Notice: Please keep your login credentials secure. You can change your password anytime after logging in.
          </p>
        </div>
      </div>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"School Central" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Your Parent Portal Credentials - Greenfield High School`,
        html: htmlContent,
      });
      this.logger.log(`Parent credential email sent successfully to ${toEmail} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`Failed to send parent email to ${toEmail}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
