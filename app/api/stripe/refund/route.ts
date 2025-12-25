import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { z } from "zod"

const refundSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { transactionId, reason } = refundSchema.parse(body)

    // Fetch the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Only admin can process refunds for now
    // In a full implementation, seller might be able to cancel before payment
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if transaction can be refunded
    if (!["PENDING", "ESCROWED"].includes(transaction.status)) {
      return NextResponse.json(
        {
          error: `Cannot refund transaction with status: ${transaction.status}`,
        },
        { status: 400 }
      )
    }

    if (!transaction.stripePaymentIntentId) {
      return NextResponse.json(
        { error: "No payment intent found for this transaction" },
        { status: 400 }
      )
    }

    // Create a refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: transaction.stripePaymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        transactionId: transaction.id,
        adminReason: reason || "No reason provided",
      },
    })

    // Update transaction status to REFUNDED
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "REFUNDED",
      },
      include: {
        listing: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update listing status back to ACTIVE
    await prisma.listing.update({
      where: { id: transaction.listingId },
      data: {
        status: "ACTIVE",
      },
    })

    console.log(
      `Refund processed for transaction ${transactionId}. Refund ID: ${refund.id}`
    )

    // TODO: Send email notifications to buyer and seller

    return NextResponse.json({
      message: "Refund processed successfully",
      transaction: updatedTransaction,
      refundId: refund.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error processing refund:", error)
    return NextResponse.json(
      { error: "Failed to process refund" },
      { status: 500 }
    )
  }
}
