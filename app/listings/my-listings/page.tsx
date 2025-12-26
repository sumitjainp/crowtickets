import Link from "next/link"
import { redirect } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

async function getUserListings(userId: string) {
  const listings = await prisma.listing.findMany({
    where: {
      sellerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return listings
}

export default async function MyListingsPage() {
  const user = await requireAuth()
  const listings = await getUserListings(user.id)

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="mt-2 text-gray-600">
              Manage your ticket listings
            </p>
          </div>
          <Link
            href="/listings/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            + Create Listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No listings yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first listing to start selling tickets
            </p>
            <Link
              href="/listings/create"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition flex items-center gap-6 relative"
              >
                <Link
                  href={`/listings/${listing.id}`}
                  className="flex items-center gap-6 flex-1 p-6 min-w-0"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-4xl">🎫</span>
                  </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {listing.eventName} • {listing.venue}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      {listing.verificationStatus === "VERIFIED" && (
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                          ✓ Verified
                        </span>
                      )}
                      {listing.verificationStatus === "PENDING" && (
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          ⏳ Pending
                        </span>
                      )}
                      {listing.verificationStatus === "FAILED" && (
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                          ✗ Failed
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          listing.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : listing.status === "SOLD"
                            ? "bg-blue-100 text-blue-800"
                            : listing.status === "EXPIRED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {listing.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>📅 {formatDate(listing.eventDate)}</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(listing.price)}
                    </span>
                    <span>Listed {formatDate(listing.createdAt)}</span>
                  </div>
                </div>
                </Link>

                <div className="flex gap-2 flex-shrink-0 pr-6 relative z-10">
                  {listing.transferCode && (
                    <Link
                      href={`/listings/${listing.id}/transfer-instructions`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 font-medium"
                    >
                      📧 Instructions
                    </Link>
                  )}
                  {listing.status === "ACTIVE" && (
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
