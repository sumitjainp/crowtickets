import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createMessageSchema = z.object({
  content: z.string().min(1).max(1000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { content } = createMessageSchema.parse(body)

    // Get dispute and check authorization
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: true,
      },
    })

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    // Check if user is part of this dispute (buyer, seller, or admin)
    const isParticipant =
      session.user.id === dispute.transaction.buyerId ||
      session.user.id === dispute.transaction.sellerId ||
      session.user.role === "ADMIN"

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        disputeId: id,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get dispute and check authorization
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: true,
      },
    })

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    // Check if user is part of this dispute
    const isParticipant =
      session.user.id === dispute.transaction.buyerId ||
      session.user.id === dispute.transaction.sellerId ||
      session.user.role === "ADMIN"

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all messages for this dispute
    const messages = await prisma.message.findMany({
      where: {
        disputeId: id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}
