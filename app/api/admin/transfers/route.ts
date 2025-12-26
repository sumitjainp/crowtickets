import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Check admin authorization
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pending transfers
    const pendingTransfers = await prisma.transaction.findMany({
      where: {
        status: "COMPLETED", // Payment completed
        transferStatus: "PENDING", // But transfer not done yet
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            eventName: true,
            venue: true,
            eventDate: true,
            transferCode: true,
            escrowEmail: true,
            ticketType: true,
            verificationStatus: true,
          },
        },
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
      orderBy: {
        createdAt: "asc", // Oldest first (FIFO)
      },
    })

    return NextResponse.json({
      transfers: pendingTransfers,
      count: pendingTransfers.length,
    })
  } catch (error) {
    console.error("Error fetching pending transfers:", error)
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    )
  }
}
