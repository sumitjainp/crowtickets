import { prisma } from "../lib/prisma"

async function cleanupAllPending() {
  try {
    // Update ALL pending transactions for this listing to FAILED
    const result = await prisma.transaction.updateMany({
      where: {
        listingId: "cmjahyq6v0003exuq7awgjozs",
        status: "PENDING",
      },
      data: {
        status: "FAILED",
      },
    })

    console.log(`✓ Updated ${result.count} pending transaction(s) to FAILED`)

    // Make sure listing is ACTIVE
    await prisma.listing.update({
      where: { id: "cmjahyq6v0003exuq7awgjozs" },
      data: { status: "ACTIVE" },
    })

    console.log("✓ Listing status set to ACTIVE")
    console.log("\n🎉 Ready for a fresh test purchase!")
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupAllPending()
