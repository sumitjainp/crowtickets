import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { notifyTransferFailed } from "@/lib/email"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      )
    }

    // Get transaction with buyer and listing details
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        buyer: true,
        listing: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Process refund via Stripe
    let refundId = null
    if (transaction.stripePaymentIntentId) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: transaction.stripePaymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            transactionId: transaction.id,
            reason: reason,
          },
        })
        refundId = refund.id
        console.log(`Refund processed: ${refundId}`)
      } catch (error) {
        console.error("Failed to process refund:", error)
        return NextResponse.json(
          { error: "Failed to process refund" },
          { status: 500 }
        )
      }
    }

    // Update transfer status
    await prisma.transaction.update({
      where: { id },
      data: {
        transferStatus: "FAILED",
        transferNotes: reason,
        transferredBy: session.user.id,
        status: "REFUNDED", // Update overall transaction status
      },
    })

    // Update listing back to ACTIVE so it can be sold again
    await prisma.listing.update({
      where: { id: transaction.listingId },
      data: {
        status: "ACTIVE",
      },
    })

    // Send notification to buyer
    await notifyTransferFailed({
      buyerEmail: transaction.buyer.email,
      buyerName: transaction.buyer.name || "Customer",
      listingTitle: transaction.listing.title,
      failReason: reason,
      amount: transaction.amount,
    })

    return NextResponse.json({
      success: true,
      message: "Transfer marked as failed and refund processed",
      refundId,
    })
  } catch (error) {
    console.error("Error marking transfer as failed:", error)
    return NextResponse.json(
      { error: "Failed to update transfer" },
      { status: 500 }
    )
  }
}
