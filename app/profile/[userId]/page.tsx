import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import { formatDateTime } from "@/lib/utils"

async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      reviewsReceived: {
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
          transaction: {
            include: {
              listing: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      listingsAsSeller: {
        where: {
          status: "ACTIVE",
        },
        take: 5,
      },
      transactionsAsSeller: {
        where: {
          status: "COMPLETED",
        },
      },
      transactionsAsBuyer: {
        where: {
          status: "COMPLETED",
        },
      },
    },
  })

  return user
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const currentUser = await getCurrentUser()
  const user = await getUserProfile(userId)

  if (!user) {
    notFound()
  }

  const isOwnProfile = currentUser?.id === userId
  const totalSales = user.transactionsAsSeller.length
  const totalPurchases = user.transactionsAsBuyer.length
  const memberSince = new Date(user.createdAt).getFullYear()

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-semibold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* User Info */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {user.name}
                  </h1>

                  {/* Satisfaction Score */}
                  {user.profile && user.profile.reviewCount > 0 ? (
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-1">👍</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {Math.round(user.profile.satisfactionScore)}%
                        </span>
                      </div>
                      <span className="text-gray-600">
                        satisfaction ({user.profile.reviewCount}{" "}
                        {user.profile.reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  ) : (
                    <div className="text-gray-500 mb-3">No reviews yet</div>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>📅</span>
                      <span>Member since {memberSince}</span>
                    </div>
                    {user.profile?.verifiedEmail && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <span>✓</span>
                        <span>Email verified</span>
                      </div>
                    )}
                    {totalSales > 0 && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {totalSales} {totalSales === 1 ? "sale" : "sales"}
                      </div>
                    )}
                    {totalPurchases > 0 && (
                      <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                        {totalPurchases}{" "}
                        {totalPurchases === 1 ? "purchase" : "purchases"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            {/* Bio */}
            {user.profile?.bio && (
              <div className="mt-6 pt-6 border-t">
                <h2 className="text-lg font-semibold mb-2">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {user.profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Listings */}
        {user.listingsAsSeller.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Active Listings</h2>
              <Link
                href={`/listings?seller=${userId}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.listingsAsSeller.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold mb-1">{listing.title}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    {listing.eventName}
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ${listing.price.toFixed(2)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">
            Reviews ({user.profile?.reviewCount || 0})
          </h2>

          {user.reviewsReceived.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">💬</div>
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {user.reviewsReceived.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.reviewer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {review.reviewer.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(review.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">
                        {review.satisfied ? "😊" : "😞"}
                      </span>
                      <span className={`font-semibold ${review.satisfied ? "text-green-600" : "text-red-600"}`}>
                        {review.satisfied ? "Satisfied" : "Dissatisfied"}
                      </span>
                    </div>
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                  )}

                  <div className="text-sm text-gray-500">
                    Transaction: {review.transaction.listing.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
