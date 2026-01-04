import { prisma } from "../lib/prisma"
import { hash } from "bcryptjs"

async function createTestListing() {
  try {
    // Create a test seller user
    const hashedPassword = await hash("password123", 12)

    const testSeller = await prisma.user.create({
      data: {
        email: "testseller@example.com",
        password: hashedPassword,
        name: "Test Seller",
        role: "SELLER",
        profile: {
          create: {
            satisfactionScore: 96.0,
            reviewCount: 15,
            verifiedEmail: true,
          },
        },
      },
    })

    console.log("✓ Created test seller:", testSeller.name, `(${testSeller.email})`)

    // Generate transfer code
    const transferCode = `TM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // Create a test listing with transfer type
    const testListing = await prisma.listing.create({
      data: {
        sellerId: testSeller.id,
        title: "2 Taylor Swift Eras Tour Tickets - Floor Seats",
        description: "Amazing floor seats for Taylor Swift's Eras Tour! Section A, Row 5. Great view of the stage. Selling 2 tickets together. Tickets will be transferred via Ticketmaster within 24 hours of purchase.",
        price: 900.00,
        quantity: 2,
        sellAsGroup: true,
        eventDate: new Date("2026-08-15T19:00:00"),
        eventName: "Taylor Swift - The Eras Tour",
        venue: "SoFi Stadium, Los Angeles",
        category: "Ticket",
        status: "ACTIVE",
        ticketType: "TICKETMASTER",
        transferCode: transferCode,
        escrowEmail: "tickets@crowtickets.com",
        verificationStatus: "VERIFIED",
      },
    })

    console.log("✓ Created test listing:", testListing.title)
    console.log("  Price:", `$${testListing.price}`)
    console.log("  Listing ID:", testListing.id)
    console.log("\n🎉 Test data created successfully!")
    console.log("\nYou can now purchase this listing at:")
    console.log(`http://localhost:3000/listings/${testListing.id}`)
  } catch (error) {
    console.error("Error creating test data:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestListing()
