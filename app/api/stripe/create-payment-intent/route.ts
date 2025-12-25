import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, formatAmountForStripe } from "@/lib/stripe"
import { z } from "zod"

const createPaymentSchema = z.object({
  listingId: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { listingId } = createPaymentSchema.parse(body)

    // Fetch the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Check if listing is active
    if (listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This listing is no longer available" },
        { status: 400 }
      )
    }

    // Prevent sellers from buying their own listings
    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot purchase your own listing" },
        { status: 400 }
      )
    }

    // Check if there's already a pending transaction for this listing
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        listingId,
        status: {
          in: ["PENDING", "ESCROWED"],
        },
      },
    })

    if (existingTransaction) {
      return NextResponse.json(
        { error: "This listing already has a pending transaction" },
        { status: 400 }
      )
    }

    // Convert amount to cents for Stripe
    const amountInCents = formatAmountForStripe(listing.price)

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        listingTitle: listing.title,
      },
      // Capture method is automatic - funds are held but can be released later
      capture_method: "automatic",
      // Description for the payment
      description: `Purchase of ${listing.title}`,
    })

    // Create a transaction record in the database
    const transaction = await prisma.transaction.create({
      data: {
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        amount: listing.price,
        stripePaymentIntentId: paymentIntent.id,
        status: "PENDING",
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

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
      amount: listing.price,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    )
  }
}
