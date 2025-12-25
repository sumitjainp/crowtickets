import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const resolveDisputeSchema = z.object({
  resolution: z.string().min(10).max(1000),
  action: z.enum(["RELEASE_TO_SELLER", "REFUND_TO_BUYER"]),
})

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
    const { resolution, action } = resolveDisputeSchema.parse(body)

    // Get dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        transaction: true,
      },
    })

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    if (dispute.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Dispute already resolved" },
        { status: 400 }
      )
    }

    // Update dispute
    await prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution,
        resolvedAt: new Date(),
      },
    })

    // Update transaction based on action
    if (action === "RELEASE_TO_SELLER") {
      await prisma.transaction.update({
        where: { id: dispute.transactionId },
        data: {
          status: "COMPLETED",
          releasedAt: new Date(),
        },
      })
    } else if (action === "REFUND_TO_BUYER") {
      await prisma.transaction.update({
        where: { id: dispute.transactionId },
        data: {
          status: "REFUNDED",
        },
      })
    }

    return NextResponse.json({ message: "Dispute resolved successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error resolving dispute:", error)
    return NextResponse.json(
      { error: "Failed to resolve dispute" },
      { status: 500 }
    )
  }
}
