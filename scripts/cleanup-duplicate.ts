import { prisma } from "../lib/prisma"

async function cleanupDuplicate() {
  try {
    // Update the duplicate PENDING transaction (the one without a payment intent that succeeded)
    const updated = await prisma.transaction.update({
      where: { id: "cmjfh9el70003cdkt0cs7t5qo" },
      data: { status: "FAILED" },
    })

    console.log("✓ Updated duplicate PENDING transaction to FAILED")
    console.log("  Transaction ID:", updated.id)
    console.log("\n✅ Cleanup complete!")
    console.log("\nYou should now see:")
    console.log("- 1 ESCROWED transaction (the valid one)")
    console.log("- 3 FAILED transactions (old tests + duplicate)")
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicate()
