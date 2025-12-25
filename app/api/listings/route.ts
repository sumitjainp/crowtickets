import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be greater than 0"),
  eventDate: z.string().datetime(),
  eventName: z.string().min(2, "Event name is required"),
  venue: z.string().min(2, "Venue is required"),
  category: z.string().default("Ticket"),
  cancellationPolicy: z.enum(["STRICT", "MODERATE", "FLEXIBLE"]).default("MODERATE"),
  ticketFileUrl: z.string().url().optional(),
  ticketType: z.enum(["PDF", "TRANSFER"]).default("PDF"),
  ticketPlatform: z.string().optional(), // TICKETMASTER, AXS, STUBHUB, etc.
})

// Helper function to generate unique transfer code
function generateTransferCode(platform: string): string {
  const prefix = platform.substring(0, 2).toUpperCase()
  const randomStr = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `${prefix}-${randomStr}`
}

// Helper function to get escrow email based on platform
function getEscrowEmail(platform: string): string {
  const platformLower = platform.toLowerCase()
  const domain = process.env.ESCROW_EMAIL_DOMAIN || "crowtickets.com"
  return `escrow+${platformLower}@${domain}`
}

// GET /api/listings - Get all listings with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const status = searchParams.get("status") || "ACTIVE"

    const where: any = {
      status: status as any,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { eventName: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                satisfactionScore: true,
                reviewCount: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(listings)
  } catch (error) {
    console.error("Error fetching listings:", error)
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 }
    )
  }
}

// POST /api/listings - Create a new listing
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const data = createListingSchema.parse(body)

    // Prepare listing data (exclude ticketPlatform as it's not in schema)
    const { ticketPlatform, ticketType, ...baseData } = data
    const listingData: any = {
      ...baseData,
      eventDate: new Date(data.eventDate),
      sellerId: session.user.id,
    }

    // If transfer-based ticket, generate transfer code and set escrow email
    if (ticketType === "TRANSFER" && ticketPlatform) {
      listingData.transferCode = generateTransferCode(ticketPlatform)
      listingData.escrowEmail = getEscrowEmail(ticketPlatform)
      listingData.verificationStatus = "PENDING"
      listingData.ticketType = ticketPlatform // Store actual platform (TICKETMASTER, AXS, etc.)
    } else {
      listingData.ticketType = "PDF"
      listingData.verificationStatus = "PENDING"
    }

    const listing = await prisma.listing.create({
      data: listingData,
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

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error" },
        { status: 400 }
      )
    }

    console.error("Error creating listing:", error)

    // Check for Prisma foreign key constraint error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign out and sign in again." },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    )
  }
}
