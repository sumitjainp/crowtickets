import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createDisputeSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().min(10).max(1000),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { transactionId, reason } = createDisputeSchema.parse(body)

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Check if user is part of this transaction
    const isParticipant =
      session.user.id === transaction.buyerId ||
      session.user.id === transaction.sellerId

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if transaction is in ESCROWED status
    if (transaction.status !== "ESCROWED") {
      return NextResponse.json(
        { error: "Can only raise disputes for escrowed transactions" },
        { status: 400 }
      )
    }

    // Check if dispute already exists for this transaction
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        transactionId,
        status: {
          in: ["OPEN", "INVESTIGATING"],
        },
      },
    })

    if (existingDispute) {
      return NextResponse.json(
        { error: "An active dispute already exists for this transaction" },
        { status: 400 }
      )
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        transactionId,
        raisedBy: session.user.id,
        reason,
        status: "OPEN",
      },
    })

    // Update transaction status to DISPUTED
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "DISPUTED" },
    })

    return NextResponse.json(dispute, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating dispute:", error)
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all disputes for transactions where user is buyer or seller
    const disputes = await prisma.dispute.findMany({
      where: {
        transaction: {
          OR: [
            { buyerId: session.user.id },
            { sellerId: session.user.id },
          ],
        },
      },
      include: {
        transaction: {
          include: {
            listing: {
              select: {
                title: true,
              },
            },
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        raiser: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(disputes)
  } catch (error) {
    console.error("Error fetching disputes:", error)
    return NextResponse.json(
      { error: "Failed to fetch disputes" },
      { status: 500 }
    )
  }
}
