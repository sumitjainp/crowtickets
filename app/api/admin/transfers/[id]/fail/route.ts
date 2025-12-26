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

    // Check admin authorization
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      )
    }

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
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
        transferStatus: "FAILED",
        transferNotes: reason,
        transferredBy: session.user.id,
      },
    })

    // TODO: Alert admin or trigger refund process
    // await alertAdmin(`Transfer failed: ${id} - ${reason}`)

    return NextResponse.json({
      success: true,
      message: "Transfer marked as failed",
    })
  } catch (error) {
    console.error("Error marking transfer as failed:", error)
    return NextResponse.json(
      { error: "Failed to update transfer" },
      { status: 500 }
    )
  }
}
