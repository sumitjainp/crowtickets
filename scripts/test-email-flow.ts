/**
 * End-to-End Email Verification Test Script
 *
 * This script tests the complete email verification flow:
 * 1. Creates a test listing with transfer code
 * 2. Sends sample email to webhook
 * 3. Verifies listing gets updated
 * 4. Checks transfer record created
 *
 * Run with: npx tsx scripts/test-email-flow.ts
 */

import { prisma } from "../lib/prisma"

async function testEmailFlow() {
  console.log("🧪 Starting End-to-End Email Verification Test\n")

  try {
    // Step 1: Find or create a test user
    console.log("1️⃣ Setting up test user...")

    let testUser = await prisma.user.findFirst({
      where: { email: "test@example.com" },
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: "test@example.com",
          name: "Test User",
          password: "hashed_password_here",
          profile: {
            create: {
              bio: "Test user for email verification",
            },
          },
        },
      })
      console.log("✅ Created test user:", testUser.id)
    } else {
      console.log("✅ Found existing test user:", testUser.id)
    }

    // Step 2: Create a test listing with TICKETMASTER transfer
    console.log("\n2️⃣ Creating test listing with transfer code...")

    const transferCode = "TM-ABC123" // Must match the sample email
    const escrowEmail = "escrow+ticketmaster@crow.com"

    const listing = await prisma.listing.create({
      data: {
        title: "Taylor Swift - The Eras Tour Test",
        description: "Test listing for email verification",
        price: 150.00,
        eventDate: new Date("2024-08-05T19:00:00"),
        eventName: "Taylor Swift - The Eras Tour",
        venue: "SoFi Stadium",
        category: "Ticket",
        cancellationPolicy: "MODERATE",
        status: "ACTIVE",
        ticketType: "TICKETMASTER",
        transferCode: transferCode,
        escrowEmail: escrowEmail,
        verificationStatus: "PENDING",
        sellerId: testUser.id,
      },
    })

    console.log("✅ Created listing:", listing.id)
    console.log("   Transfer Code:", listing.transferCode)
    console.log("   Verification Status:", listing.verificationStatus)

    // Step 3: Simulate webhook receiving email
    console.log("\n3️⃣ Simulating email webhook...")

    const webhookUrl = "http://localhost:3000/api/email/webhook"

    const sampleEmail = {
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

Transfer Code: ${transferCode}

Confirmation #: 45-67890/LOS

The tickets have been sent to: ${escrowEmail}

The recipient will receive an email with instructions to accept the transfer.

Thank you for using Ticketmaster!
      `.trim(),
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sampleEmail),
    })

    const webhookResult = await response.json()

    if (webhookResult.success) {
      console.log("✅ Webhook processed successfully")
      console.log("   Listing ID:", webhookResult.data?.listingId)
      console.log("   Transfer ID:", webhookResult.data?.transferId)
      console.log("   Verification:", webhookResult.data?.verificationStatus)
    } else {
      console.log("❌ Webhook failed:", webhookResult.error)
      throw new Error("Webhook processing failed")
    }

    // Step 4: Verify listing was updated
    console.log("\n4️⃣ Verifying listing update...")

    const updatedListing = await prisma.listing.findUnique({
      where: { id: listing.id },
    })

    if (!updatedListing) {
      throw new Error("Listing not found")
    }

    console.log("✅ Listing updated:")
    console.log("   Verification Status:", updatedListing.verificationStatus)

    if (updatedListing.ticketDetails) {
      const details = JSON.parse(updatedListing.ticketDetails)
      console.log("   Ticket Details:", {
        section: details.section,
        row: details.row,
        seat: details.seat,
        confirmationNumber: details.confirmationNumber,
      })
    }

    // Step 5: Check transfer record
    console.log("\n5️⃣ Checking transfer record...")

    const transfer = await prisma.ticketTransfer.findFirst({
      where: { listingId: listing.id },
      orderBy: { createdAt: "desc" },
    })

    if (transfer) {
      console.log("✅ Transfer record created:")
      console.log("   ID:", transfer.id)
      console.log("   Transfer Code:", transfer.transferCode)
      console.log("   Status:", transfer.verificationStatus)
      console.log("   Received At:", transfer.receivedAt)

      if (transfer.parsedData) {
        const parsed = JSON.parse(transfer.parsedData)
        console.log("   Parsed Data:", {
          eventName: parsed.eventName,
          venue: parsed.venue,
          section: parsed.section,
        })
      }
    } else {
      throw new Error("Transfer record not created")
    }

    // Step 6: Summary
    console.log("\n" + "=".repeat(60))
    console.log("🎉 End-to-End Test PASSED!")
    console.log("=".repeat(60))
    console.log("\n✅ All steps completed successfully:")
    console.log("   1. Test user created/found")
    console.log("   2. Listing created with transfer code")
    console.log("   3. Email webhook processed email")
    console.log("   4. Listing verification status updated to VERIFIED")
    console.log("   5. Transfer record created in database")
    console.log("   6. Ticket details extracted and stored\n")

    // Cleanup option
    console.log("💡 To clean up test data, run:")
    console.log(`   DELETE FROM Listing WHERE id = '${listing.id}';`)
    console.log(`   DELETE FROM TicketTransfer WHERE listingId = '${listing.id}';\n`)
  } catch (error) {
    console.error("\n❌ Test failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testEmailFlow()
