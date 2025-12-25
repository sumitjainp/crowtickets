import { prisma } from "../lib/prisma"

async function cleanupTestTransaction() {
  try {
    // Find the pending transaction for the test listing
    const pendingTransaction = await prisma.transaction.findFirst({
      where: {
        listingId: "cmjahyq6v0003exuq7awgjozs",
        status: "PENDING",
      },
    })

    if (pendingTransaction) {
      // Update it to FAILED so it doesn't block new purchases
      await prisma.transaction.update({
        where: { id: pendingTransaction.id },
        data: { status: "FAILED" },
      })
      console.log("✓ Updated pending transaction to FAILED status")
      console.log("  Transaction ID:", pendingTransaction.id)
    } else {
      console.log("No pending transaction found")
    }

    // Also make sure the listing is back to ACTIVE status
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

cleanupTestTransaction()
