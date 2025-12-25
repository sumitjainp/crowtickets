import Link from "next/link"
import { notFound } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"

async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
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

  return listing
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getListing(id)
  const currentUser = await getCurrentUser()

  if (!listing) {
    notFound()
  }

  const isOwner = currentUser?.id === listing.sellerId

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <Link
          href="/listings"
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-6"
        >
          ← Back to Listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-96 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-9xl">🎫</div>
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {listing.title}
                    </h1>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      {listing.category}
                    </span>
                  </div>
                  {isOwner && (
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Event</div>
                    <div className="font-semibold">{listing.eventName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Date</div>
                    <div className="font-semibold">
                      {formatDateTime(listing.eventDate)}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Venue</div>
                    <div className="font-semibold">{listing.venue}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {listing.description}
                  </p>
                </div>

                {/* Cancellation Policy Section */}
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Cancellation Policy</h2>
                  {listing.cancellationPolicy === "STRICT" && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🔒</span>
                        <span className="font-semibold text-red-900">Strict Policy</span>
                      </div>
                      <ul className="text-sm text-red-800 space-y-1 ml-7">
                        <li>• Full refund within 2 hours of purchase</li>
                        <li>• 50% refund within 24 hours of purchase</li>
                        <li>• No refunds after 24 hours</li>
                      </ul>
                      <p className="text-xs text-red-700 mt-2 ml-7">
                        Best for high-demand events. Buyer commitment required.
                      </p>
                    </div>
                  )}
                  {listing.cancellationPolicy === "MODERATE" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">⚖️</span>
                        <span className="font-semibold text-blue-900">Moderate Policy</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Recommended</span>
                      </div>
                      <ul className="text-sm text-blue-800 space-y-1 ml-7">
                        <li>• Full refund within 2 hours of purchase</li>
                        <li>• 90% refund within 24 hours</li>
                        <li>• 75% refund 1-7 days before event</li>
                        <li>• 50% refund within 7 days of event</li>
                        <li>• No refunds within 24 hours of event</li>
                      </ul>
                      <p className="text-xs text-blue-700 mt-2 ml-7">
                        Balanced approach for both buyers and sellers.
                      </p>
                    </div>
                  )}
                  {listing.cancellationPolicy === "FLEXIBLE" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✅</span>
                        <span className="font-semibold text-green-900">Flexible Policy</span>
                      </div>
                      <ul className="text-sm text-green-800 space-y-1 ml-7">
                        <li>• Full refund within 2 hours of purchase</li>
                        <li>• 90% refund until 7 days before event</li>
                        <li>• 75% refund 3-7 days before event</li>
                        <li>• 50% refund 1-3 days before event</li>
                        <li>• No refunds within 24 hours of event</li>
                      </ul>
                      <p className="text-xs text-green-700 mt-2 ml-7">
                        Most buyer-friendly option. Great for uncertain plans.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Listed {formatDateTime(listing.createdAt)}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                      {listing.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6 sticky top-4">
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-1">Price</div>
                <div className="text-4xl font-bold text-blue-600">
                  {formatCurrency(listing.price)}
                </div>
              </div>

              {!isOwner && listing.status === "ACTIVE" && (
                <Link
                  href={`/checkout/${listing.id}`}
                  className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 text-center mb-3"
                >
                  Purchase Ticket
                </Link>
              )}

              {!isOwner && listing.status === "SOLD" && (
                <div className="bg-gray-100 p-4 rounded-md mb-3">
                  <p className="text-sm text-gray-700 text-center font-semibold">
                    This ticket has been sold
                  </p>
                </div>
              )}

              {isOwner && (
                <div className="bg-blue-50 p-4 rounded-md mb-3">
                  <p className="text-sm text-blue-800">
                    This is your listing. You cannot purchase your own ticket.
                  </p>
                </div>
              )}

              <div className="text-center text-sm text-gray-600 mb-4">
                💳 Secure payment via Stripe
                <br />
                🔒 Funds held in escrow until delivery
              </div>
            </div>

            {/* Seller card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Seller Information</h3>

              <Link
                href={`/profile/${listing.seller.id}`}
                className="block hover:bg-gray-50 rounded-lg p-3 -m-3 mb-4 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                    {listing.seller.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {listing.seller.name}
                    </div>
                  </div>
                </div>

                {/* Satisfaction Score Display */}
                {listing.seller.profile &&
                listing.seller.profile.reviewCount > 0 ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👍</span>
                      <div>
                        <div className="font-bold text-lg text-gray-900">
                          {Math.round(listing.seller.profile.satisfactionScore)}% satisfied
                        </div>
                        <div className="text-sm text-gray-600">
                          {listing.seller.profile.reviewCount}{" "}
                          {listing.seller.profile.reviewCount === 1
                            ? "review"
                            : "reviews"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                    <span className="text-sm text-gray-600">No reviews yet</span>
                  </div>
                )}
              </Link>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span>📅</span>
                  <span>
                    Member since {new Date(listing.seller.createdAt).getFullYear()}
                  </span>
                </div>
                {listing.seller.profile?.verifiedEmail && (
                  <div className="flex items-center gap-2 text-green-600">
                    <span>✓</span>
                    <span>Email verified</span>
                  </div>
                )}
              </div>

              {!isOwner && (
                <button
                  disabled
                  className="mt-4 w-full border border-gray-300 py-2 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Message Seller (Coming Soon)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
