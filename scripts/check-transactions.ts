import { prisma } from "../lib/prisma"

async function checkTransactions() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        listingId: "cmjahyq6v0003exuq7awgjozs",
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    console.log(`Found ${transactions.length} transaction(s) for this listing:\n`)

    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transaction ID: ${tx.id}`)
      console.log(`   Status: ${tx.status}`)
      console.log(`   Amount: $${tx.amount}`)
      console.log(`   Created: ${tx.createdAt}`)
      console.log(`   Buyer ID: ${tx.buyerId}`)
      console.log()
    })
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTransactions()
