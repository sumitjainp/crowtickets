import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { emailParserFactory } from "@/lib/email-parser"

/**
 * Email Webhook Endpoint
 *
 * This endpoint receives forwarded emails from the escrow email addresses
 * and processes them to verify ticket transfers.
 *
 * SETUP INSTRUCTIONS:
 * -------------------
 * For Gmail:
 * 1. Set up Gmail filter to forward escrow emails to this webhook
 * 2. Use Gmail API or SMTP to receive emails
 * 3. Parse email content and forward to this endpoint
 *
 * For SendGrid Inbound Parse:
 * 1. Point your escrow domain emails to SendGrid
 * 2. Configure SendGrid to POST to this URL: https://yourdomain.com/api/email/webhook
 * 3. SendGrid will send email data as multipart/form-data
 *
 * For Mailgun:
 * 1. Set up route to forward emails to this webhook
 * 2. Configure POST endpoint in Mailgun dashboard
 */

interface IncomingEmail {
  from: string
  to: string
  subject: string
  text: string
  html?: string
  receivedAt?: string
}

/**
 * POST /api/email/webhook
 * Receives and processes incoming transfer confirmation emails
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const contentType = req.headers.get("content-type") || ""

    let emailData: IncomingEmail

    if (contentType.includes("application/json")) {
      // Direct JSON format (for testing or custom email forwarders)
      emailData = await req.json()
    } else if (contentType.includes("multipart/form-data")) {
      // SendGrid Inbound Parse format
      const formData = await req.formData()
      emailData = {
        from: formData.get("from") as string,
        to: formData.get("to") as string,
        subject: formData.get("subject") as string,
        text: formData.get("text") as string,
        html: formData.get("html") as string,
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      )
    }

    console.log("📧 Received email:", {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
    })

    // Validate required fields
    if (!emailData.from || !emailData.to || !emailData.subject || !emailData.text) {
      return NextResponse.json(
        { error: "Missing required email fields" },
        { status: 400 }
      )
    }

    // Extract platform from escrow email
    // Format: escrow+platform@crow.com -> "platform"
    const platformMatch = emailData.to.match(/escrow\+(\w+)@/i)
    const platformHint = platformMatch
      ? platformMatch[1].toUpperCase()
      : undefined

    console.log("🎫 Detected platform hint:", platformHint)

    // Parse email content
    const parseResult = emailParserFactory.parseEmail(
      emailData.text,
      emailData.subject,
      emailData.from,
      platformHint
    )

    if (!parseResult.success || !parseResult.data) {
      console.error("❌ Failed to parse email:", parseResult.error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse email",
          details: parseResult.error,
        },
        { status: 422 }
      )
    }

    const parsedData = parseResult.data

    console.log("✅ Parsed email data:", {
      transferCode: parsedData.transferCode,
      platform: parsedData.platform,
      eventName: parsedData.eventName,
    })

    // Check if transfer code was found
    if (!parsedData.transferCode) {
      console.warn("⚠️ No transfer code found in email")

      // Store the email anyway for manual review
      await prisma.ticketTransfer.create({
        data: {
          listingId: "", // Will be null/empty - for admin review
          transferCode: "UNKNOWN",
          senderEmail: parsedData.senderEmail,
          receiverEmail: parsedData.receiverEmail,
          receivedAt: new Date(),
          transferEmailData: JSON.stringify({
            subject: emailData.subject,
            from: emailData.from,
            to: emailData.to,
            body: emailData.text.substring(0, 1000), // Store first 1000 chars
          }),
          parsedData: JSON.stringify(parsedData),
          verificationStatus: "FAILED",
          verificationNotes: "No transfer code found in email",
        },
      })

      return NextResponse.json({
        success: false,
        message: "No transfer code found - saved for manual review",
      })
    }

    // Find matching listing by transfer code
    const listing = await prisma.listing.findFirst({
      where: {
        transferCode: parsedData.transferCode,
      },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!listing) {
      console.warn("⚠️ No listing found for transfer code:", parsedData.transferCode)

      // Store for manual review
      await prisma.ticketTransfer.create({
        data: {
          listingId: "", // No matching listing
          transferCode: parsedData.transferCode,
          senderEmail: parsedData.senderEmail,
          receiverEmail: parsedData.receiverEmail,
          receivedAt: new Date(),
          transferEmailData: JSON.stringify({
            subject: emailData.subject,
            from: emailData.from,
            to: emailData.to,
          }),
          parsedData: JSON.stringify(parsedData),
          verificationStatus: "FAILED",
          verificationNotes: `No listing found with transfer code: ${parsedData.transferCode}`,
        },
      })

      return NextResponse.json({
        success: false,
        message: "No matching listing found - saved for manual review",
      })
    }

    console.log("🎯 Found matching listing:", listing.id, listing.title)

    // Create transfer record
    const transfer = await prisma.ticketTransfer.create({
      data: {
        listingId: listing.id,
        transferCode: parsedData.transferCode,
        senderEmail: parsedData.senderEmail,
        receiverEmail: parsedData.receiverEmail,
        receivedAt: new Date(),
        transferEmailData: JSON.stringify({
          subject: emailData.subject,
          from: emailData.from,
          to: emailData.to,
          receivedAt: emailData.receivedAt || new Date().toISOString(),
        }),
        parsedData: JSON.stringify(parsedData),
        verificationStatus: "VERIFIED",
        verificationNotes: "Automatically verified via email webhook",
      },
    })

    console.log("📝 Created transfer record:", transfer.id)

    // Update listing verification status and ticket details
    const updatedListing = await prisma.listing.update({
      where: {
        id: listing.id,
      },
      data: {
        verificationStatus: "VERIFIED",
        ticketDetails: JSON.stringify({
          eventName: parsedData.eventName || listing.eventName,
          venue: parsedData.venue || listing.venue,
          section: parsedData.section,
          row: parsedData.row,
          seat: parsedData.seat,
          quantity: parsedData.quantity,
          confirmationNumber: parsedData.confirmationNumber,
          verifiedAt: new Date().toISOString(),
          verifiedVia: "email",
        }),
      },
    })

    console.log("✅ Updated listing verification status:", updatedListing.id)

    // TODO: Send notification to seller
    // await sendEmail({
    //   to: listing.seller.email,
    //   subject: "Tickets Verified - Your Listing is Now Active",
    //   body: `Great news! We've received and verified your ticket transfer for "${listing.title}".`
    // })

    return NextResponse.json({
      success: true,
      message: "Transfer verified successfully",
      data: {
        listingId: listing.id,
        transferId: transfer.id,
        transferCode: parsedData.transferCode,
        verificationStatus: "VERIFIED",
      },
    })
  } catch (error) {
    console.error("❌ Error processing email webhook:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/email/webhook
 * Test endpoint to verify webhook is accessible
 */
export async function GET() {
  return NextResponse.json({
    message: "Email webhook endpoint is active",
    endpoint: "/api/email/webhook",
    methods: ["POST"],
    supportedFormats: ["application/json", "multipart/form-data"],
    instructions: {
      sendgrid: "Configure Inbound Parse to POST to this URL",
      mailgun: "Set up route to forward to this URL",
      gmail: "Use Gmail API or custom forwarder",
      testing: "Send POST with JSON: { from, to, subject, text }",
    },
  })
}
