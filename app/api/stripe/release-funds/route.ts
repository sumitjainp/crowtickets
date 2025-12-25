import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const releaseFundsSchema = z.object({
  transactionId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { transactionId } = releaseFundsSchema.parse(body)

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

    // Check authorization - only buyer or admin can release funds
    const isAuthorized =
      session.user.id === transaction.buyerId ||
      session.user.role === "ADMIN"

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if transaction is in ESCROWED status
    if (transaction.status !== "ESCROWED") {
      return NextResponse.json(
        {
          error: `Cannot release funds for transaction with status: ${transaction.status}`,
        },
        { status: 400 }
      )
    }

    // Note: In a real escrow system with Stripe Connect, you would:
    // 1. Use Stripe Connect to hold funds in a connected account
    // 2. Transfer funds to the seller's connected account here
    //
    // For this MVP, we're simulating the escrow by:
    // 1. Marking the transaction as COMPLETED
    // 2. Recording the release timestamp
    //
    // To implement full Stripe Connect:
    // const transfer = await stripe.transfers.create({
    //   amount: formatAmountForStripe(transaction.amount),
    //   currency: "usd",
    //   destination: seller.stripeAccountId,
    //   transfer_group: transaction.id,
    // })

    // Update transaction status to COMPLETED and record release time
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
        releasedAt: new Date(),
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

    console.log(
      `Funds released for transaction ${transactionId} to seller ${transaction.sellerId}`
    )

    // TODO: Send email notifications to buyer and seller
    // TODO: Prompt both parties to leave reviews

    return NextResponse.json({
      message: "Funds released successfully",
      transaction: updatedTransaction,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error releasing funds:", error)
    return NextResponse.json(
      { error: "Failed to release funds" },
      { status: 500 }
    )
  }
}
