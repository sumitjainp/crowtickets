import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import CheckoutForm from "@/components/checkout/CheckoutForm"

async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
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

  return listing
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/checkout/" + listingId)
  }

  const listing = await getListing(listingId)

  if (!listing) {
    notFound()
  }

  // Check if listing is available
  if (listing.status !== "ACTIVE") {
    redirect(`/listings/${listingId}`)
  }

  // Prevent buying own listing
  if (listing.sellerId === currentUser.id) {
    redirect(`/listings/${listingId}`)
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Complete Your Purchase
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{listing.title}</span>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              {listing.eventName}
            </div>
            <div className="text-sm text-gray-600">{listing.venue}</div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-blue-600">
              ${listing.price.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          <CheckoutForm listingId={listing.id} amount={listing.price} />
        </div>

        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            How Escrow Protection Works
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Your payment is securely held in escrow</li>
            <li>✓ Seller receives ticket transfer notification</li>
            <li>✓ You confirm receipt of the ticket</li>
            <li>✓ Funds are released to the seller</li>
            <li>✓ Full refund if ticket is not delivered</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
