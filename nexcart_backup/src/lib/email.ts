import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
const senderEmail = process.env.SENDER_EMAIL || 'noreply@nexcart.luxury';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// CENTRAL EMAIL SENDER
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string | Buffer }[];
}): Promise<boolean> {
  console.log(`📧 [Email Service] Preparing to send email to ${to}: "${subject}"`);
  
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: `NexCart Luxury <${senderEmail}>`,
        to: [to],
        subject,
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? Buffer.from(att.content) : att.content,
        })),
      });
      if (error) {
        console.error("❌ [Resend API Error]:", error);
        throw error;
      }
      console.log("✅ [Email Service] Successfully sent via Resend API:", data?.id);
      return true;
    } catch (e) {
      console.warn("⚠️ [Resend] Failed. Falling back to SMTP configuration...");
    }
  }

  // Nodemailer fallback
  try {
    // If SMTP environment variables are defined, use them. Otherwise, run mock logger.
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"NexCart Luxury" <${senderEmail}>`,
        to,
        subject,
        html,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
        })),
      });
      console.log("✅ [Email Service] Successfully sent via SMTP fallback.");
      return true;
    } else {
      console.log("📝 [Email Service] Mock Send (SMTP credentials missing):");
      console.log(`----------------------------------------`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Attachments: ${attachments?.map(a => a.filename).join(', ') || 'None'}`);
      console.log(`Body Snippet: ${html.substring(0, 300)}...`);
      console.log(`----------------------------------------`);
      return true;
    }
  } catch (err) {
    console.error("❌ [Email Service] Failed both Resend and SMTP fallback:", err);
    return false;
  }
}

// LUXURY LAYOUT WRAPPER
function luxuryEmailWrapper(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9f9fb;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border: 1px solid #e4e4e7;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          }
          .header {
            background-color: #0f172a;
            padding: 32px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: #ffffff;
            text-transform: uppercase;
          }
          .logo span {
            color: #d4af37;
          }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
            color: #0f172a;
          }
          .content p {
            font-size: 14px;
            color: #71717a;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            background-color: #0f172a;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 32px;
            font-size: 12px;
            font-weight: 700;
            border-radius: 9999px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            margin: 20px 0;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .footer {
            background-color: #f4f4f5;
            padding: 24px;
            text-align: center;
            font-size: 11px;
            color: #a1a1aa;
            border-t: 1px solid #e4e4e7;
          }
          .footer a {
            color: #d4af37;
            text-decoration: none;
            font-weight: 600;
          }
          .divider {
            height: 1px;
            background-color: #e4e4e7;
            margin: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Nex<span>Cart</span></div>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} NexCart Luxury Technologies Inc. <br>
            One Infinite Loop, Cupertino, CA 95014 <br>
            Need assistance? Contact our <a href="mailto:concierge@nexcart.luxury">Concierge Service</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

// 1. User Registration / Welcome Template
export async function sendWelcomeEmail(to: string, userName: string) {
  const html = luxuryEmailWrapper(
    "Welcome to NexCart Luxury",
    `
      <h2>Welcome, ${userName}</h2>
      <p>Thank you for creating an account with NexCart. We are thrilled to welcome you to our curated luxury circle.</p>
      <p>Discover hand-assembled Swiss automatic chronographs, tuned audiophile acoustic monitors, and artisanal Italian leather weekend bags designed to travel for generations.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search" class="btn">Explore Curation</a>
      <p>Warmest regards,<br>The NexCart Concierge Team</p>
    `
  );
  return sendEmail({ to, subject: "Welcome to NexCart Curation", html });
}

// 2. Email Verification Template
export async function sendVerificationEmail(to: string, userName: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const html = luxuryEmailWrapper(
    "Verify Your Email Address",
    `
      <h2>Verify Your Account</h2>
      <p>Hello ${userName},</p>
      <p>Please click the button below to verify your email address and activate your account. This link will remain active for 24 hours.</p>
      <div style="text-align: center;">
        <a href="${verifyUrl}" class="btn">Verify Account</a>
      </div>
      <p>If you did not initiate this request, please ignore this email or contact support.</p>
    `
  );
  return sendEmail({ to, subject: "Verify Your NexCart Account", html });
}

// 3. Password Reset Template
export async function sendPasswordResetEmail(to: string, userName: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const html = luxuryEmailWrapper(
    "Reset Your Password",
    `
      <h2>Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset the password for your NexCart account. Click the button below to establish a new password.</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      <p>If you did not request a password reset, you can safely ignore this email. Your current password will remain secure.</p>
    `
  );
  return sendEmail({ to, subject: "Reset Your NexCart Password", html });
}

// 4. Order Confirmation Template
export async function sendOrderConfirmationEmail(to: string, userName: string, order: any) {
  const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 12px 0; font-size: 14px; font-weight: 600;">${item.name} ${item.variant ? `<br><span style="font-size: 11px; font-weight: normal; color: #71717a;">Option: ${item.variant}</span>` : ''}</td>
      <td style="padding: 12px 0; font-size: 14px; text-align: center; color: #71717a;">${item.quantity}</td>
      <td style="padding: 12px 0; font-size: 14px; text-align: right; font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = luxuryEmailWrapper(
    "Order Confirmation",
    `
      <h2>Order Confirmed</h2>
      <p>Thank you for your purchase, ${userName}. Your order <strong>${order.orderNumber}</strong> has been registered at our logistics center.</p>
      <div class="divider"></div>
      
      <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">ORDER DETAILS</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #e4e4e7; font-size: 11px; font-weight: 700; color: #a1a1aa; text-align: left; text-transform: uppercase;">
            <th style="padding-bottom: 8px;">Item</th>
            <th style="padding-bottom: 8px; text-align: center;">Qty</th>
            <th style="padding-bottom: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <table style="width: 100%; font-size: 13px; font-weight: 600; line-height: 1.8; color: #71717a;">
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right;">$${(order.totalAmount - order.shippingCost).toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax (18% inclusive)</td>
          <td style="text-align: right;">$${order.taxAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Logistics Shipping</td>
          <td style="text-align: right;">$${order.shippingCost.toFixed(2)}</td>
        </tr>
        ${order.discountAmount > 0 ? `
        <tr style="color: #22c55e;">
          <td>Discount Applied</td>
          <td style="text-align: right;">-$${order.discountAmount.toFixed(2)}</td>
        </tr>` : ''}
        <tr style="color: #0f172a; font-size: 16px; font-weight: 700; border-top: 1px solid #e4e4e7;">
          <td style="padding-top: 12px;">Grand Total</td>
          <td style="padding-top: 12px; text-align: right; color: #d4af37;">$${order.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
      
      <div class="divider"></div>
      
      <p style="font-size: 13px;"><strong>Shipping Address:</strong><br>${order.shippingAddress}</p>
    `
  );
  return sendEmail({ to, subject: `NexCart Order Confirmation - ${order.orderNumber}`, html });
}

// 5. Payment Success / Stripe Invoice Template
export async function sendPaymentSuccessEmail(to: string, userName: string, orderNumber: string, transactionId: string, amount: number) {
  const html = luxuryEmailWrapper(
    "Payment Invoice Captured",
    `
      <h2>Payment Invoice Captured</h2>
      <p>Hello ${userName},</p>
      <p>We have successfully captured your payment details for order <strong>${orderNumber}</strong>. The transaction was verified and secure.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; font-size: 13px;">
        <p style="margin: 0 0 8px 0;"><strong>Transaction ID:</strong> <span style="font-family: monospace;">${transactionId}</span></p>
        <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
        <p style="margin: 0;"><strong>Captured Amount:</strong> <span style="color: #d4af37; font-weight: 700;">$${amount.toFixed(2)}</span></p>
      </div>
      <p>Your luxury consignment is moving to our packaging center. We will notify you once standard shipping begins.</p>
    `
  );
  return sendEmail({ to, subject: `NexCart Payment Successful - ${orderNumber}`, html });
}

// 6. Order Shipped Template
export async function sendOrderShippedEmail(to: string, userName: string, orderNumber: string, trackingNumber: string) {
  const html = luxuryEmailWrapper(
    "Your Luxury Consignment is Dispatched",
    `
      <h2>Your Consignment is Shipped</h2>
      <p>Hello ${userName},</p>
      <p>Great news! Your luxury items for order <strong>${orderNumber}</strong> have been packaged and handed over to our air courier service.</p>
      <p>You can track the shipment progress using the courier reference code:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; font-family: monospace; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #0f172a; border: 1px dashed #0f172a; padding: 12px 24px; border-radius: 8px; background-color: #f8fafc;">
          ${trackingNumber}
        </span>
      </div>
      <p>Expect standard dispatch speeds to deliver your shipment in 2-5 business days.</p>
    `
  );
  return sendEmail({ to, subject: `Your NexCart Order ${orderNumber} Has Shipped`, html });
}

// 7. Order Delivered Template
export async function sendOrderDeliveredEmail(to: string, userName: string, orderNumber: string) {
  const html = luxuryEmailWrapper(
    "Consignment Successfully Delivered",
    `
      <h2>Order Delivered</h2>
      <p>Hello ${userName},</p>
      <p>According to our logistics courier, order <strong>${orderNumber}</strong> has been successfully delivered to your shipping address.</p>
      <p>We hope you enjoy your premium selections. If you have any feedback or would like to leave a product review, please write a review directly on the product detail page.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders" class="btn">Manage Orders</a>
    `
  );
  return sendEmail({ to, subject: `NexCart Order ${orderNumber} Delivered`, html });
}

// 8. Refund Issued Template
export async function sendRefundIssuedEmail(to: string, userName: string, orderNumber: string, amount: number) {
  const html = luxuryEmailWrapper(
    "Refund Processed",
    `
      <h2>Refund Processed Successfully</h2>
      <p>Hello ${userName},</p>
      <p>We have processed a refund of <span style="font-weight: 700;">$${amount.toFixed(2)}</span> for order <strong>${orderNumber}</strong>.</p>
      <p>The funds should reflect back in your original payment source (credit card / PayPal) within 5 to 10 working business days depending on your banking institution.</p>
      <p>If you have any questions, contact our concierge department.</p>
    `
  );
  return sendEmail({ to, subject: `NexCart Refund Issued - ${orderNumber}`, html });
}

// 9. Newsletter Welcome Template
export async function sendNewsletterEmail(to: string) {
  const html = luxuryEmailWrapper(
    "Subscribed to NexCart Journal",
    `
      <h2>Welcome to the NexCart Journal</h2>
      <p>Thank you for subscribing. You will now receive exclusive coverage of luxury releases, editorial columns, and early access notifications for limited stock items.</p>
      <p>As a valued subscriber, we will notify you immediately before any new arrivals or seasonal collections drop.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/search" class="btn">View Current Journal</a>
    `
  );
  return sendEmail({ to, subject: "Welcome to the NexCart Journal", html });
}

// 10. Abandoned Cart Template
export async function sendAbandonedCartEmail(to: string, userName: string, cartTotal: number) {
  const html = luxuryEmailWrapper(
    "Items Awaiting in Your Cart",
    `
      <h2>Items Awaiting Checkout</h2>
      <p>Hello ${userName},</p>
      <p>You have left items worth <strong style="color: #d4af37;">$${cartTotal.toFixed(2)}</strong> in your NexCart shopping bag.</p>
      <p>These pieces are currently in high demand and we cannot guarantee their stock levels for long. Complete your transaction today to lock in your luxury selections.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cart" class="btn">Resume Checkout Bag</a>
    `
  );
  return sendEmail({ to, subject: "Complete Your NexCart Checkout", html });
}
