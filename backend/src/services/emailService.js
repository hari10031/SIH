import nodemailer from 'nodemailer';
import config from '../config/config.js';

// Mock email service - Replace with actual email service configuration
class EmailService {
  constructor() {
    // Create transporter based on environment
    if (config.NODE_ENV === 'production') {
      // Production email configuration
      this.transporter = nodemailer.createTransporter({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        secure: config.EMAIL_PORT === 465,
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS
        }
      });
    } else {
      // Development/Test configuration (using Ethereal for testing)
      this.transporter = null;
      this.initTestTransporter();
    }
  }

  // Initialize test transporter for development
  async initTestTransporter() {
    try {
      if (config.NODE_ENV !== 'production') {
        // Create test account for development
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      }
    } catch (error) {
      console.warn('Could not create test email transporter:', error.message);
      this.transporter = null;
    }
  }

  // Send verification email
  async sendVerificationEmail(email, token) {
    try {
      const verificationUrl = `${config.CORS_ORIGIN}/verify-email/${token}`;
      
      const mailOptions = {
        from: config.EMAIL_USER || 'noreply@sih-backend.com',
        to: email,
        subject: 'Verify Your Email Address',
        html: this.getVerificationEmailTemplate(verificationUrl)
      };

      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        
        if (config.NODE_ENV !== 'production') {
          console.log('📧 Verification email sent:', nodemailer.getTestMessageUrl(info));
        }
        
        return {
          success: true,
          messageId: info.messageId,
          previewUrl: config.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
        };
      } else {
        // Mock email sending for development without transporter
        console.log(`📧 Mock verification email sent to ${email}`);
        console.log(`🔗 Verification URL: ${verificationUrl}`);
        
        return {
          success: true,
          messageId: 'mock-message-id',
          previewUrl: verificationUrl
        };
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, token) {
    try {
      const resetUrl = `${config.CORS_ORIGIN}/reset-password/${token}`;
      
      const mailOptions = {
        from: config.EMAIL_USER || 'noreply@sih-backend.com',
        to: email,
        subject: 'Reset Your Password',
        html: this.getPasswordResetEmailTemplate(resetUrl)
      };

      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        
        if (config.NODE_ENV !== 'production') {
          console.log('📧 Password reset email sent:', nodemailer.getTestMessageUrl(info));
        }
        
        return {
          success: true,
          messageId: info.messageId,
          previewUrl: config.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
        };
      } else {
        // Mock email sending for development without transporter
        console.log(`📧 Mock password reset email sent to ${email}`);
        console.log(`🔗 Reset URL: ${resetUrl}`);
        
        return {
          success: true,
          messageId: 'mock-message-id',
          previewUrl: resetUrl
        };
      }
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // Send welcome email
  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: config.EMAIL_USER || 'noreply@sih-backend.com',
        to: email,
        subject: 'Welcome to SIH Backend!',
        html: this.getWelcomeEmailTemplate(name)
      };

      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        
        if (config.NODE_ENV !== 'production') {
          console.log('📧 Welcome email sent:', nodemailer.getTestMessageUrl(info));
        }
        
        return {
          success: true,
          messageId: info.messageId,
          previewUrl: config.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
        };
      } else {
        console.log(`📧 Mock welcome email sent to ${email}`);
        return {
          success: true,
          messageId: 'mock-message-id'
        };
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  // Email templates
  getVerificationEmailTemplate(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for signing up! Please click the button below to verify your email address and activate your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This link will expire in 24 hours for security reasons.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #ff6b6b; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            This link will expire in 1 hour for security reasons.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeEmailTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SIH Backend!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to SIH Backend!</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Welcome to our platform! We're excited to have you on board. Your account has been successfully created and you're ready to get started.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            If you have any questions or need assistance, feel free to reach out to our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Thank you for choosing our platform!
          </p>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();