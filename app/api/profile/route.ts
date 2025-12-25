import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
})

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = updateProfileSchema.parse(body)

    // Update user name if provided
    const updateData: any = {}
    if (data.name) {
      updateData.name = data.name
    }

    // Update user
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    // Update or create profile with bio
    if (data.bio !== undefined) {
      await prisma.userProfile.upsert({
        where: { userId: session.user.id },
        update: { bio: data.bio },
        create: {
          userId: session.user.id,
          bio: data.bio,
        },
      })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
