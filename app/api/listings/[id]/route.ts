import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateListingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  eventDate: z.string().datetime().optional(),
  eventName: z.string().min(2).optional(),
  venue: z.string().min(2).optional(),
  category: z.string().optional(),
  cancellationPolicy: z.enum(["STRICT", "MODERATE", "FLEXIBLE"]).optional(),
  status: z.enum(["ACTIVE", "SOLD", "EXPIRED", "REMOVED"]).optional(),
  ticketFileUrl: z.string().url().optional(),
  ticketType: z.enum(["PDF", "TRANSFER"]).optional(),
  ticketPlatform: z.string().optional(),
})

// Helper functions (same as in create route)
function generateTransferCode(platform: string): string {
  const prefix = platform.substring(0, 2).toUpperCase()
  const randomStr = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `${prefix}-${randomStr}`
}

function getEscrowEmail(platform: string): string {
  const platformLower = platform.toLowerCase()
  const domain = process.env.ESCROW_EMAIL_DOMAIN || "crowtickets.com"
  return `escrow+${platformLower}@${domain}`
}

// GET /api/listings/[id] - Get a specific listing
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                satisfactionScore: true,
                reviewCount: true,
                verifiedEmail: true,
              },
            },
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(listing)
  } catch (error) {
    console.error("Error fetching listing:", error)
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    )
  }
}

// PATCH /api/listings/[id] - Update a listing
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = updateListingSchema.parse(body)

    // Prepare update data (exclude ticketPlatform as it's not in schema)
    const { ticketPlatform, ticketType, ...baseData } = data
    const updateData: any = {
      ...baseData,
      eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
    }

    // If changing to transfer-based ticket, generate transfer code
    if (ticketType === "TRANSFER" && ticketPlatform) {
      // Only generate new code if listing doesn't already have one or platform changed
      if (!listing.transferCode || listing.ticketType !== ticketPlatform) {
        updateData.transferCode = generateTransferCode(ticketPlatform)
        updateData.escrowEmail = getEscrowEmail(ticketPlatform)
        updateData.verificationStatus = "PENDING"
      }
      updateData.ticketType = ticketPlatform
    } else if (ticketType === "PDF") {
      updateData.ticketType = "PDF"
      // Clear transfer-related fields
      updateData.transferCode = null
      updateData.escrowEmail = null
      updateData.verificationStatus = "PENDING"
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedListing)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating listing:", error)
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    )
  }
}

// DELETE /api/listings/[id] - Delete a listing
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const listing = await prisma.listing.findUnique({
      where: { id },
    })

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      )
    }

    if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    await prisma.listing.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Listing deleted successfully" })
  } catch (error) {
    console.error("Error deleting listing:", error)
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 }
    )
  }
}
