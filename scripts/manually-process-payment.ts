import { prisma } from "../lib/prisma"
import { notifyAdminNewTransfer, notifyBuyerPaymentSuccess, notifySellerTicketSold } from "../lib/email"

async function processPayment() {
  // Find the most recent PENDING transaction
  const transaction = await prisma.transaction.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      listing: true,
      buyer: true,
      seller: true,
    },
  })

  if (!transaction) {
    console.log("No PENDING transactions found")
    return
  }

  console.log(`Found PENDING transaction: ${transaction.listing.title}`)
  console.log(`Buyer: ${transaction.buyer.email}`)
  console.log(`Amount: $${transaction.amount}`)

  // Update to ESCROWED
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { status: "ESCROWED" },
  })

  // Update listing to SOLD
  await prisma.listing.update({
    where: { id: transaction.listingId },
    data: { status: "SOLD" },
  })

  console.log("\n✅ Updated transaction to ESCROWED")
  console.log("✅ Updated listing to SOLD")

  // Send emails
  console.log("\n📧 Sending emails...")

  await Promise.all([
    notifyAdminNewTransfer({
      transactionId: transaction.id,
      listingTitle: transaction.listing.title,
      buyerEmail: transaction.buyer.email,
      amount: transaction.amount,
      transferCode: transaction.listing.transferCode || "N/A",
    }),
    notifyBuyerPaymentSuccess({
      buyerEmail: transaction.buyer.email,
      buyerName: transaction.buyer.name,
      listingTitle: transaction.listing.title,
      eventName: transaction.listing.eventName,
      eventDate: transaction.listing.eventDate,
      venue: transaction.listing.venue,
      amount: transaction.amount,
      transactionId: transaction.id,
    }),
    notifySellerTicketSold({
      sellerEmail: transaction.seller.email,
      sellerName: transaction.seller.name,
      listingTitle: transaction.listing.title,
      eventName: transaction.listing.eventName,
      buyerName: transaction.buyer.name,
      amount: transaction.amount,
      transactionId: transaction.id,
    }),
  ])

  console.log("✅ All emails sent!")
  console.log("\n🎉 Payment processed successfully!")

  await prisma.$disconnect()
}

processPayment()
