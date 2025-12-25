import { NextResponse } from "next/server"
import { emailParserFactory } from "@/lib/email-parser"

/**
 * Test Email Parser Endpoint
 *
 * This endpoint allows testing email parsers without setting up email forwarding.
 * Send sample email content to see what data gets extracted.
 */

// Sample email templates for different platforms
const SAMPLE_EMAILS = {
  TICKETMASTER: {
    from: "noreply@ticketmaster.com",
    to: "escrow+ticketmaster@crow.com",
    subject: "Your Tickets for Taylor Swift - The Eras Tour have been transferred",
    text: `
Your tickets have been successfully transferred!

Event: Taylor Swift - The Eras Tour
Venue: SoFi Stadium
Date: Saturday, August 5, 2024 at 7:00 PM
Section: 101
Row: 15
Seats: 1-2

Transfer Code: TM-ABC123

Confirmation #: 45-67890/LOS

The tickets have been sent to: escrow+ticketmaster@crow.com

The recipient will receive an email with instructions to accept the transfer.

Thank you for using Ticketmaster!
    `.trim(),
  },
  AXS: {
    from: "noreply@axs.com",
    to: "escrow+axs@crow.com",
    subject: "Tickets transferred: Bad Bunny - Most Wanted Tour",
    text: `
You've successfully transferred your tickets!

Show: Bad Bunny - Most Wanted Tour
Venue: Crypto.com Arena
Date: Friday, March 15, 2024 at 8:00 PM

Sec: 215
Row: J
Seats: 5-6
Qty: 2

Transfer Code: AX-XYZ789

Order #: AXS-98765432
Reference: TRF-2024-001

Transferred to: escrow+axs@crow.com

The recipient will be notified via email and can accept the transfer through their AXS account.

Thank you for choosing AXS!
    `.trim(),
  },
  STUBHUB: {
    from: "tickets@stubhub.com",
    to: "escrow+stubhub@crow.com",
    subject: "Your tickets for The Weeknd - After Hours Tour",
    text: `
Ticket Transfer Confirmation

Event: The Weeknd - After Hours Tour
Venue: Madison Square Garden
Section: 200
Row: 12
Seats: 7-8

Transfer Code: ST-QWE456

Order #: SH-123456789

Recipient: escrow+stubhub@crow.com

Your tickets have been successfully transferred. The recipient will receive an email with download instructions.

Questions? Visit stubhub.com/help
    `.trim(),
  },
}

/**
 * POST /api/email/test
 * Test email parser with custom or sample email content
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      from,
      to,
      subject,
      text,
      platform,
      useSample,
    } = body

    let emailData: {
      from: string
      to: string
      subject: string
      text: string
    }

    // Use sample email if requested
    if (useSample && SAMPLE_EMAILS[useSample as keyof typeof SAMPLE_EMAILS]) {
      emailData = SAMPLE_EMAILS[useSample as keyof typeof SAMPLE_EMAILS]
      console.log(`📧 Using sample ${useSample} email`)
    } else if (from && to && subject && text) {
      // Use provided email data
      emailData = { from, to, subject, text }
    } else {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["from", "to", "subject", "text"],
          alternative: "Set useSample to TICKETMASTER, AXS, or STUBHUB",
        },
        { status: 400 }
      )
    }

    // Detect platform from email
    const detectedPlatform = platform || emailParserFactory.detectPlatform(
      emailData.text,
      emailData.from
    )

    console.log("🔍 Detected platform:", detectedPlatform)

    // Parse the email
    const parseResult = emailParserFactory.parseEmail(
      emailData.text,
      emailData.subject,
      emailData.from,
      detectedPlatform
    )

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: parseResult.error,
        emailData: {
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Email parsed successfully",
      input: {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        textPreview: emailData.text.substring(0, 200) + "...",
      },
      detected: {
        platform: detectedPlatform,
      },
      parsed: parseResult.data,
    })
  } catch (error) {
    console.error("Error testing email parser:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/email/test
 * Show available sample emails and usage instructions
 */
export async function GET() {
  return NextResponse.json({
    message: "Email Parser Test Endpoint",
    usage: {
      method: "POST",
      contentType: "application/json",
      examples: [
        {
          description: "Test with sample Ticketmaster email",
          body: {
            useSample: "TICKETMASTER",
          },
        },
        {
          description: "Test with sample AXS email",
          body: {
            useSample: "AXS",
          },
        },
        {
          description: "Test with custom email",
          body: {
            from: "sender@example.com",
            to: "escrow+ticketmaster@crow.com",
            subject: "Ticket transfer confirmation",
            text: "Your email content here...",
            platform: "TICKETMASTER", // Optional
          },
        },
      ],
    },
    availableSamples: Object.keys(SAMPLE_EMAILS),
    sampleEmails: SAMPLE_EMAILS,
  })
}
