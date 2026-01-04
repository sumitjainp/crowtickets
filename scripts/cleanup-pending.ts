import { prisma } from "../lib/prisma"

async function cleanupPending() {
  try {
    // Delete all PENDING transactions older than 1 minute (for testing)
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000)

    const deleted = await prisma.transaction.deleteMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: oneMinuteAgo,
        },
      },
    })

    console.log(`✅ Cleaned up ${deleted.count} stale PENDING transactions`)

    // Show remaining PENDING transactions
    const remaining = await prisma.transaction.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        listing: {
          select: {
            title: true,
          },
        },
      },
    })

    if (remaining.length > 0) {
      console.log(`\n⚠️  ${remaining.length} PENDING transactions still exist (created <1 min ago):`)
      remaining.forEach(t => {
        const createdAt = new Date(t.createdAt).toLocaleString()
        console.log(`  - ${t.listing.title} (created ${createdAt})`)
      })
    } else {
      console.log("\n✨ No PENDING transactions remaining!")
    }
  } catch (error) {
    console.error("Error cleaning up:", error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupPending()
