import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@crowtickets.com"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@crowtickets.com"

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("📧 Email would be sent (Resend not configured):", {
        to,
        subject,
      })
      return { success: true, simulated: true }
    }

    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    console.log("📧 Email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Failed to send email:", error)
    return { success: false, error }
  }
}

// Admin alert when new transfer is pending
export async function notifyAdminNewTransfer({
  transactionId,
  listingTitle,
  buyerEmail,
  amount,
  transferCode,
}: {
  transactionId: string
  listingTitle: string
  buyerEmail: string
  amount: number
  transferCode: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .info-box { background: white; border: 2px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 15px 0; }
          .info-label { font-weight: bold; color: #7c2d12; }
          .urgent { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎫 New Transfer Pending!</h1>
          </div>
          <div class="content">
            <div class="urgent">
              <strong>⚠️ ACTION REQUIRED:</strong> A ticket sale has been completed and needs to be transferred to the buyer.
            </div>

            <div class="info-box">
              <p><span class="info-label">Listing:</span> ${listingTitle}</p>
              <p><span class="info-label">Buyer Email:</span> ${buyerEmail}</p>
              <p><span class="info-label">Transfer Code:</span> <code style="background: #fef3c7; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${transferCode}</code></p>
              <p><span class="info-label">Amount:</span> $${(amount / 100).toFixed(2)}</p>
              <p><span class="info-label">Transaction ID:</span> <code style="font-size: 11px;">${transactionId}</code></p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Log into your admin dashboard</li>
              <li>Go to the Transfer Queue</li>
              <li>Complete the transfer to the buyer</li>
            </ol>

            <center>
              <a href="${process.env.NEXT_PUBLIC_URL || "https://crowtickets.vercel.app"}/admin/transfers" class="button">
                Go to Transfer Queue →
              </a>
            </center>
          </div>
          <div class="footer">
            <p>CrowTickets Admin Alert System</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `🎫 New Transfer Pending: ${listingTitle}`,
    html,
  })
}

// Notify buyer when transfer is completed
export async function notifyBuyerTransferComplete({
  buyerEmail,
  buyerName,
  listingTitle,
  eventName,
  eventDate,
  venue,
  ticketType,
}: {
  buyerEmail: string
  buyerName: string
  listingTitle: string
  eventName: string
  eventDate: Date
  venue: string
  ticketType: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          .success-box { background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center; }
          .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 Your Tickets Have Been Sent!</h1>
          </div>
          <div class="content">
            <p>Hi ${buyerName},</p>

            <div class="success-box">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h2 style="margin: 0; color: #065f46;">Transfer Complete!</h2>
              <p style="margin: 5px 0 0 0;">Your tickets have been transferred to your email</p>
            </div>

            <div class="info-box">
              <p><strong>Event:</strong> ${eventName}</p>
              <p><strong>Venue:</strong> ${venue}</p>
              <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</p>
              <p><strong>Platform:</strong> ${ticketType}</p>
            </div>

            <h3>📧 Check Your Email</h3>
            <p>You should receive a transfer notification from <strong>${ticketType}</strong> at <strong>${buyerEmail}</strong>.</p>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Check your email inbox for the transfer notification from ${ticketType}</li>
              <li>Click "Accept Transfer" or "View Tickets"</li>
              <li>The tickets will be added to your ${ticketType} account</li>
              <li>Download or save your tickets for the event</li>
            </ol>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0;">
              <strong>⚠️ Important:</strong> You must accept the transfer in your ${ticketType} account. Check your spam/promotions folder if you don't see the email within a few minutes.
            </div>

            <p>Enjoy the event! 🎊</p>
          </div>
          <div class="footer">
            <p>Questions? Contact us at support@crowtickets.com</p>
            <p>CrowTickets - Secure Ticket Escrow</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: buyerEmail,
    subject: `✅ Your Tickets for ${eventName} Have Been Sent!`,
    html,
  })
}

// Notify buyer to accept transfer if they haven't after 24 hours
export async function notifyBuyerAcceptTransfer({
  buyerEmail,
  buyerName,
  listingTitle,
  eventName,
  ticketType,
}: {
  buyerEmail: string
  buyerName: string
  listingTitle: string
  eventName: string
  ticketType: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          .urgent { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⏰ Reminder: Accept Your Ticket Transfer</h1>
          </div>
          <div class="content">
            <p>Hi ${buyerName},</p>

            <div class="urgent">
              <div style="font-size: 36px; text-align: center; margin-bottom: 10px;">⚠️</div>
              <p style="text-align: center; margin: 0;"><strong>Your ticket transfer is waiting to be accepted!</strong></p>
            </div>

            <p>We noticed you haven't accepted the ticket transfer for <strong>${eventName}</strong> yet.</p>

            <h3>📧 What to do:</h3>
            <ol>
              <li>Check your email inbox at <strong>${buyerEmail}</strong></li>
              <li>Look for an email from <strong>${ticketType}</strong> (check spam/promotions folder)</li>
              <li>Click "Accept Transfer" in that email</li>
              <li>The tickets will be added to your ${ticketType} account</li>
            </ol>

            <p><strong>Important:</strong> You must accept the transfer to complete the process and access your tickets. The transfer email was sent from ${ticketType}, not from us.</p>

            <p>If you're having trouble finding the email or accepting the transfer, please contact us immediately at support@crowtickets.com</p>
          </div>
          <div class="footer">
            <p>CrowTickets - Secure Ticket Escrow</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: buyerEmail,
    subject: `⏰ Reminder: Accept Your ${eventName} Ticket Transfer`,
    html,
  })
}

// Notify admin and buyer when transfer fails
export async function notifyTransferFailed({
  buyerEmail,
  buyerName,
  listingTitle,
  failReason,
  amount,
}: {
  buyerEmail: string
  buyerName: string
  listingTitle: string
  failReason: string
  amount: number
}) {
  const buyerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          .alert { background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Issue with Your Ticket Purchase</h1>
          </div>
          <div class="content">
            <p>Hi ${buyerName},</p>

            <div class="alert">
              <p><strong>We encountered an issue transferring your tickets for "${listingTitle}".</strong></p>
              <p><strong>Reason:</strong> ${failReason}</p>
            </div>

            <h3>📧 What happens next:</h3>
            <p>We're processing a full refund of <strong>$${(amount / 100).toFixed(2)}</strong> to your original payment method. The refund should appear in your account within 5-10 business days.</p>

            <p>We apologize for the inconvenience. If you have any questions, please contact us at support@crowtickets.com</p>
          </div>
          <div class="footer">
            <p>CrowTickets - Secure Ticket Escrow</p>
          </div>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: buyerEmail,
    subject: `Refund Processed: ${listingTitle}`,
    html: buyerHtml,
  })
}
