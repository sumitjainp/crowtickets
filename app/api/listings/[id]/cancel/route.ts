import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Get the listing
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        status: true,
        title: true,
      },
    })

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 })
    }

    // Check if user is the seller
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own listings" },
        { status: 403 }
      )
    }

    // Check if listing can be cancelled
    if (listing.status === "SOLD") {
      return NextResponse.json(
        { error: "Cannot cancel a sold listing" },
        { status: 400 }
      )
    }

    if (listing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Listing is already cancelled" },
        { status: 400 }
      )
    }

    // Update listing to cancelled
    await prisma.listing.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Listing cancelled successfully",
    })
  } catch (error) {
    console.error("Error cancelling listing:", error)
    return NextResponse.json(
      { error: "Failed to cancel listing" },
      { status: 500 }
    )
  }
}
