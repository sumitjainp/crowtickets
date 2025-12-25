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
            rating: 4.8,
            reviewCount: 15,
            verifiedEmail: true,
          },
        },
      },
    })

    console.log("✓ Created test seller:", testSeller.name, `(${testSeller.email})`)

    // Create a test listing
    const testListing = await prisma.listing.create({
      data: {
        sellerId: testSeller.id,
        title: "Taylor Swift Eras Tour - Floor Seats",
        description: "Amazing floor seats for Taylor Swift's Eras Tour! Section A, Row 5. Great view of the stage. Tickets will be transferred via Ticketmaster within 24 hours of purchase.",
        price: 450.00,
        eventDate: new Date("2025-08-15T19:00:00"),
        eventName: "Taylor Swift - The Eras Tour",
        venue: "SoFi Stadium, Los Angeles",
        category: "Concert",
        status: "ACTIVE",
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
