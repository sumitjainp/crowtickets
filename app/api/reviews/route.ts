import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createReviewSchema = z.object({
  transactionId: z.string().min(1),
  satisfied: z.boolean(),
  comment: z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { transactionId, satisfied, comment } = createReviewSchema.parse(body)

    // Get transaction details
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        listing: true,
      },
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

    // Check if transaction is completed
    if (transaction.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Can only review completed transactions" },
        { status: 400 }
      )
    }

    // Determine who to review (the other party)
    const reviewerId = session.user.id
    const revieweeId =
      reviewerId === transaction.buyerId
        ? transaction.sellerId
        : transaction.buyerId

    // Check if user already reviewed this transaction
    const existingReview = await prisma.review.findFirst({
      where: {
        transactionId,
        reviewerId,
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this transaction" },
        { status: 400 }
      )
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        transactionId,
        reviewerId,
        revieweeId,
        satisfied,
        comment: comment || null,
      },
    })

    // Update reviewee's profile satisfaction score (percentage)
    const allReviews = await prisma.review.findMany({
      where: {
        revieweeId,
      },
    })

    const satisfiedCount = allReviews.filter((r) => r.satisfied).length
    const satisfactionScore = (satisfiedCount / allReviews.length) * 100

    await prisma.userProfile.upsert({
      where: { userId: revieweeId },
      update: {
        satisfactionScore,
        reviewCount: allReviews.length,
      },
      create: {
        userId: revieweeId,
        satisfactionScore,
        reviewCount: allReviews.length,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    )
  }
}
