import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import EditProfileForm from "@/components/profile/EditProfileForm"

async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  })

  return user
}

export default async function EditProfilePage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/profile/edit")
  }

  const user = await getUserProfile(currentUser.id)

  if (!user) {
    redirect("/")
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600 mt-2">
            Update your profile information
          </p>
        </div>

        <EditProfileForm
          userId={user.id}
          currentName={user.name}
          currentBio={user.profile?.bio || ""}
        />
      </div>
    </div>
  )
}
