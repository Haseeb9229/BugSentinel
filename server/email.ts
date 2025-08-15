import nodemailer from 'nodemailer';

// Create transporter based on environment variables
const createTransporter = () => {
  // Check if we have Gmail credentials
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  // Check if we have SendGrid credentials
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Check if we have Resend credentials
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  }

  // Fallback to a test account (for development)
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'test123'
    }
  });
};

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.GMAIL_USER || process.env.FROM_EMAIL || 'noreply@bugpatrol.app',
      to: notification.to,
      subject: notification.subject,
      html: notification.html,
      text: notification.text || notification.html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendScanCompletedEmail(
  storeName: string,
  storeEmail: string,
  issuesFound: number,
  scanDuration: string,
  dashboardUrl?: string
): Promise<boolean> {
  const subject = `🔍 Scan Completed - ${storeName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #008060; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Bug Patrol</h1>
        <p style="margin: 10px 0 0 0;">QA & Site Monitoring</p>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #333;">Scan Completed Successfully</h2>
        <p>Your website scan has been completed for <strong>${storeName}</strong>.</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Scan Summary</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>Issues Found:</strong> ${issuesFound}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>Scan Duration:</strong> ${scanDuration}
            </li>
            <li style="padding: 8px 0;">
              <strong>Completed At:</strong> ${new Date().toLocaleString()}
            </li>
          </ul>
        </div>
        
        ${dashboardUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${dashboardUrl}" style="background: #008060; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 14px;">
          This is an automated notification from Bug Patrol. 
          You can manage your notification preferences in your dashboard settings.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: storeEmail,
    subject,
    html
  });
}

export async function sendCriticalIssueEmail(
  storeName: string,
  storeEmail: string,
  issueType: string,
  description: string,
  dashboardUrl?: string
): Promise<boolean> {
  const subject = `🚨 Critical Issue Detected - ${storeName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ff4757; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Bug Patrol</h1>
        <p style="margin: 10px 0 0 0;">Critical Issue Alert</p>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #333;">Critical Issue Detected</h2>
        <p>A critical issue has been detected on your website <strong>${storeName}</strong>.</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4757;">
          <h3 style="margin-top: 0; color: #333;">Issue Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>Type:</strong> ${issueType}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>Description:</strong> ${description}
            </li>
            <li style="padding: 8px 0;">
              <strong>Detected At:</strong> ${new Date().toLocaleString()}
            </li>
          </ul>
        </div>
        
        ${dashboardUrl ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="${dashboardUrl}" style="background: #ff4757; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Issue Details
          </a>
        </div>
        ` : ''}
        
        <p style="color: #666; font-size: 14px;">
          This is an automated critical alert from Bug Patrol. 
          Please review and address this issue as soon as possible.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: storeEmail,
    subject,
    html
  });
}

export async function sendTestEmail(to: string): Promise<boolean> {
  const subject = '🧪 Bug Patrol - Test Email';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #008060; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Bug Patrol</h1>
        <p style="margin: 10px 0 0 0;">Test Email</p>
      </div>
      
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #333;">Email Notifications Working!</h2>
        <p>This is a test email to confirm that your email notifications are properly configured.</p>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Email service: Configured and working</li>
            <li>Recipient: ${to}</li>
            <li>Sent at: ${new Date().toLocaleString()}</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          You will now receive notifications for scan completions and critical issues.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to,
    subject,
    html
  });
} 