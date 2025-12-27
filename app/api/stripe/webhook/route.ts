import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { notifyAdminNewTransfer } from "@/lib/email"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("stripe-signature")

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find the transaction by payment intent ID
        const transaction = await prisma.transaction.findFirst({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
          include: {
            listing: true,
            buyer: true,
          },
        })

        if (!transaction) {
          console.error(
            `Transaction not found for payment intent: ${paymentIntent.id}`
          )
          break
        }

        // Update transaction status to ESCROWED
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "ESCROWED",
          },
        })

        // Update listing status to SOLD
        await prisma.listing.update({
          where: { id: transaction.listingId },
          data: {
            status: "SOLD",
          },
        })

        console.log(
          `Payment successful for transaction ${transaction.id}, funds are now in escrow`
        )

        // Send admin notification for pending transfer
        await notifyAdminNewTransfer({
          transactionId: transaction.id,
          listingTitle: transaction.listing.title,
          buyerEmail: transaction.buyer.email,
          amount: transaction.amount,
          transferCode: transaction.listing.transferCode || "N/A",
        })

        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Find the transaction
        const transaction = await prisma.transaction.findFirst({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
        })

        if (!transaction) {
          console.error(
            `Transaction not found for payment intent: ${paymentIntent.id}`
          )
          break
        }

        // Update transaction status to FAILED (we'll need to add this status)
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
          },
        })

        console.log(`Payment failed for transaction ${transaction.id}`)

        // TODO: Send email notification to buyer
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge

        // Find the transaction by payment intent ID
        const transaction = await prisma.transaction.findFirst({
          where: {
            stripePaymentIntentId: charge.payment_intent as string,
          },
        })

        if (!transaction) {
          console.error(
            `Transaction not found for charge: ${charge.id}`
          )
          break
        }

        // Update transaction status to REFUNDED
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: "REFUNDED",
          },
        })

        // Update listing status back to ACTIVE
        await prisma.listing.update({
          where: { id: transaction.listingId },
          data: {
            status: "ACTIVE",
          },
        })

        console.log(`Refund processed for transaction ${transaction.id}`)

        // TODO: Send email notifications
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
