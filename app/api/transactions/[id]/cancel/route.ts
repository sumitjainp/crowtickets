import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateRefund, type CancellationPolicy } from "@/lib/utils"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get transaction with listing details
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer: true,
        seller: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Verify user is the buyer
    if (transaction.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the buyer can cancel this transaction" },
        { status: 403 }
      )
    }

    // Can only cancel ESCROWED transactions
    if (transaction.status !== "ESCROWED") {
      return NextResponse.json(
        { error: `Cannot cancel transaction with status: ${transaction.status}` },
        { status: 400 }
      )
    }

    // Calculate refund
    const refundCalc = calculateRefund(
      transaction.listing.cancellationPolicy as CancellationPolicy,
      transaction.createdAt,
      transaction.listing.eventDate,
      transaction.amount
    )

    if (!refundCalc.canCancel) {
      return NextResponse.json(
        { error: refundCalc.reason || "Cancellation not allowed at this time" },
        { status: 400 }
      )
    }

    // TODO: Process Stripe refund here
    // For now, we'll just update the database
    // In production, you would:
    // 1. Create a refund via Stripe API using transaction.stripePaymentIntentId
    // 2. Wait for webhook confirmation
    // 3. Then update the transaction

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: "REFUNDED",
      },
    })

    // Update listing status back to ACTIVE
    await prisma.listing.update({
      where: { id: transaction.listingId },
      data: { status: "ACTIVE" },
    })

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      refund: {
        percentage: refundCalc.refundPercentage,
        amount: refundCalc.refundAmount,
      },
    })
  } catch (error) {
    console.error("Error cancelling transaction:", error)
    return NextResponse.json(
      { error: "Failed to cancel transaction" },
      { status: 500 }
    )
  }
}
