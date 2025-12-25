import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import { formatCurrency } from "@/lib/utils"

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>
}) {
  const params = await searchParams
  const paymentIntentId = params.payment_intent
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin")
  }

  if (!paymentIntentId) {
    redirect("/")
  }

  // Find the transaction by payment intent ID
  const transaction = await prisma.transaction.findFirst({
    where: {
      stripePaymentIntentId: paymentIntentId,
      buyerId: currentUser.id,
    },
    include: {
      listing: true,
      seller: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!transaction) {
    redirect("/")
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-8">
            Your payment has been processed and funds are securely held in
            escrow.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            <div className="text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Listing</span>
                <span className="font-medium">{transaction.listing.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Event</span>
                <span className="font-medium">
                  {transaction.listing.eventName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Seller</span>
                <span className="font-medium">{transaction.seller.name}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {transaction.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li>1. The seller will be notified of your purchase</li>
              <li>2. You'll receive the ticket details via email</li>
              <li>
                3. Once you receive the ticket, confirm receipt in your
                transaction
              </li>
              <li>4. Funds will be released to the seller after confirmation</li>
            </ol>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/transactions/${transaction.id}`}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              View Transaction
            </Link>
            <Link
              href="/listings"
              className="flex-1 border border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Browse More Listings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
