import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

async function getListings(cancellationPolicy?: string) {
  const where: any = {
    status: "ACTIVE",
  }

  if (cancellationPolicy && ["STRICT", "MODERATE", "FLEXIBLE"].includes(cancellationPolicy)) {
    where.cancellationPolicy = cancellationPolicy
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

  return listings
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ policy?: string }>
}) {
  const { policy } = await searchParams
  const listings = await getListings(policy)

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Tickets</h1>
            <p className="mt-2 text-gray-600">
              Find tickets for concerts, sports, and events
            </p>
          </div>
          <Link
            href="/listings/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            + List Ticket
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Cancellation Policy:</span>
            <Link
              href="/listings"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                !policy
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </Link>
            <Link
              href="/listings?policy=FLEXIBLE"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                policy === "FLEXIBLE"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✅ Flexible
            </Link>
            <Link
              href="/listings?policy=MODERATE"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                policy === "MODERATE"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⚖️ Moderate
            </Link>
            <Link
              href="/listings?policy=STRICT"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                policy === "STRICT"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🔒 Strict
            </Link>
            {policy && (
              <span className="text-sm text-gray-600 ml-2">
                ({listings.length} {listings.length === 1 ? "listing" : "listings"})
              </span>
            )}
          </div>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No listings yet
            </h2>
            <p className="text-gray-600 mb-6">
              Be the first to list a ticket for sale!
            </p>
            <Link
              href="/listings/create"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Create First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition border overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-white text-6xl">🎫</div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {listing.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(listing.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="line-clamp-1">{listing.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span className="font-medium text-gray-900">{listing.seller.name}</span>
                    </div>
                    {/* Seller Satisfaction Badge */}
                    {listing.seller.profile && listing.seller.profile.reviewCount > 0 ? (
                      <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-1 w-fit">
                        <span className="text-base">👍</span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(listing.seller.profile.satisfactionScore)}%
                        </span>
                        <span className="text-xs text-gray-600">
                          ({listing.seller.profile.reviewCount})
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 italic">
                        New seller - no reviews yet
                      </div>
                    )}
                  </div>

                  {/* Cancellation Policy Badge */}
                  <div className="mb-4">
                    {listing.cancellationPolicy === "STRICT" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded">
                        🔒 Strict Policy
                      </span>
                    )}
                    {listing.cancellationPolicy === "MODERATE" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded">
                        ⚖️ Moderate Policy
                      </span>
                    )}
                    {listing.cancellationPolicy === "FLEXIBLE" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">
                        ✅ Flexible Policy
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(listing.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {listing.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
