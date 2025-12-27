import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyBuyerTransferComplete } from "@/lib/email"

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

    const body = await req.json().catch(() => ({}))
    const { notes } = body

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: true,
        buyer: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Update transfer status
    await prisma.transaction.update({
      where: { id },
      data: {
        transferStatus: "COMPLETED",
        transferredAt: new Date(),
        transferredBy: session.user.id,
        transferNotes: notes || "Transfer completed via admin dashboard",
      },
    })

    // Send email notification to buyer
    await notifyBuyerTransferComplete({
      buyerEmail: transaction.buyer.email,
      buyerName: transaction.buyer.name || "Customer",
      listingTitle: transaction.listing.title,
      eventName: transaction.listing.eventName || transaction.listing.title,
      eventDate: transaction.listing.eventDate,
      venue: transaction.listing.venue || "TBA",
      ticketType: transaction.listing.ticketType,
    })

    return NextResponse.json({
      success: true,
      message: "Transfer marked as completed",
    })
  } catch (error) {
    console.error("Error completing transfer:", error)
    return NextResponse.json(
      { error: "Failed to complete transfer" },
      { status: 500 }
    )
  }
}
