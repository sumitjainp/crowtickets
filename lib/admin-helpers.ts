import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  return session.user
}

export async function isAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user?.role === "ADMIN"
}
