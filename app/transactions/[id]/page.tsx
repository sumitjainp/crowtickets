import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import { formatCurrency, formatDateTime, type CancellationPolicy } from "@/lib/utils"
import ConfirmReceiptButton from "@/components/transactions/ConfirmReceiptButton"
import ReviewForm from "@/components/transactions/ReviewForm"
import CancelTransactionButton from "@/components/transactions/CancelTransactionButton"

async function getTransaction(id: string, currentUserId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      listing: true,
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviews: {
        where: {
          reviewerId: currentUserId,
        },
        include: {
          reviewee: {
            select: {
              name: true,
            },
          },
        },
      },
      disputes: {
        where: {
          status: {
            in: ["OPEN", "INVESTIGATING"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  })

  return transaction
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/transactions/" + id)
  }

  const transaction = await getTransaction(id, currentUser.id)

  if (!transaction) {
    notFound()
  }

  // Check authorization - only buyer, seller, or admin can view
  const isAuthorized =
    currentUser.id === transaction.buyerId ||
    currentUser.id === transaction.sellerId ||
    currentUser.role === "ADMIN"

  if (!isAuthorized) {
    redirect("/")
  }

  const isBuyer = currentUser.id === transaction.buyerId
  const isSeller = currentUser.id === transaction.sellerId

  // Determine status badge color
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ESCROWED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    REFUNDED: "bg-red-100 text-red-800",
    DISPUTED: "bg-orange-100 text-orange-800",
    FAILED: "bg-red-100 text-red-800",
  }

  const statusColor =
    statusColors[transaction.status] || "bg-gray-100 text-gray-800"

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <Link
          href="/transactions"
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-6"
        >
          ← Back to Transactions
        </Link>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Transaction Details
                </h1>
                <p className="text-sm text-gray-600">ID: {transaction.id}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full font-semibold ${statusColor}`}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Listing Information */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">Listing Information</h2>
            <Link
              href={`/listings/${transaction.listing.id}`}
              className="block hover:bg-gray-50 -m-2 p-2 rounded-lg"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">🎫</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {transaction.listing.title}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Event: {transaction.listing.eventName}</div>
                    <div>Venue: {transaction.listing.venue}</div>
                    <div>
                      Date: {formatDateTime(transaction.listing.eventDate)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Payment Information */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Amount</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Transaction Date
                </div>
                <div className="font-semibold">
                  {formatDateTime(transaction.createdAt)}
                </div>
              </div>
              {transaction.releasedAt && (
                <div className="col-span-2">
                  <div className="text-sm text-gray-600 mb-1">
                    Funds Released
                  </div>
                  <div className="font-semibold">
                    {formatDateTime(transaction.releasedAt)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Parties Information */}
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-4">Parties</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-2">Buyer</div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {transaction.buyer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {transaction.buyer.name}
                      {isBuyer && (
                        <span className="ml-2 text-xs text-blue-600">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transaction.buyer.email}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-2">Seller</div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {transaction.seller.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {transaction.seller.name}
                      {isSeller && (
                        <span className="ml-2 text-xs text-purple-600">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transaction.seller.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Information and Actions */}
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Status & Actions</h2>

            {transaction.status === "PENDING" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Payment Pending:</strong> Your payment is being
                  processed. This usually takes a few moments.
                </p>
              </div>
            )}

            {transaction.status === "ESCROWED" && isBuyer && (
              <div className="space-y-4">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">⏳</div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-lg mb-2">
                        Payment Received - Ticket Transfer in Progress
                      </h3>
                      <p className="text-sm text-blue-800 mb-3">
                        Your payment is securely held in escrow. Here's what happens next:
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-3">
                    <h4 className="font-semibold text-blue-900 mb-3 text-sm">📋 Next Steps:</h4>
                    <ol className="space-y-3 text-sm text-blue-900">
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">1.</span>
                        <span><strong>Admin transfers ticket to your email</strong> - Typically within 24 hours</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">2.</span>
                        <span><strong>Check your email</strong> for transfer notification from the ticket platform (Ticketmaster, AXS, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">3.</span>
                        <span><strong>Accept the transfer</strong> in your ticket platform account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">4.</span>
                        <span><strong>Confirm receipt below</strong> to release funds to seller</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">
                    <strong>🔒 Your Protection:</strong> Funds won't be released until you confirm you've received the tickets.
                  </div>
                </div>

                <ConfirmReceiptButton transactionId={transaction.id} />
                <CancelTransactionButton
                  transactionId={transaction.id}
                  amount={transaction.amount}
                  purchaseDate={transaction.createdAt}
                  eventDate={transaction.listing.eventDate}
                  cancellationPolicy={transaction.listing.cancellationPolicy as CancellationPolicy}
                />
                <div className="flex items-center gap-3 pt-4 border-t">
                  <span className="text-sm text-gray-600">Having issues?</span>
                  <Link
                    href={`/disputes/create?transactionId=${transaction.id}`}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Raise a Dispute
                  </Link>
                </div>
              </div>
            )}

            {transaction.status === "ESCROWED" && isSeller && (
              <div className="space-y-4">
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">💰</div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-lg mb-2">
                        Payment Secured - Transfer in Progress
                      </h3>
                      <p className="text-sm text-blue-800">
                        Great news! The buyer's payment is securely held in escrow.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-3">
                    <h4 className="font-semibold text-blue-900 mb-3 text-sm">📋 What Happens Next:</h4>
                    <ol className="space-y-2 text-sm text-blue-900">
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">1.</span>
                        <span><strong>Our admin team handles the ticket transfer</strong> - No action needed from you!</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">2.</span>
                        <span><strong>Buyer receives and confirms</strong> the ticket</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold min-w-[20px]">3.</span>
                        <span><strong>Funds released to you</strong> within 24-48 hours of confirmation</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-3 text-sm text-green-800">
                    <strong>💵 Your Earnings:</strong> ${(transaction.amount / 100).toFixed(2)} will be released once buyer confirms receipt.
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <span className="text-sm text-gray-600">Having issues?</span>
                  <Link
                    href={`/disputes/create?transactionId=${transaction.id}`}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Raise a Dispute
                  </Link>
                </div>
              </div>
            )}

            {transaction.status === "COMPLETED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Transaction Complete:</strong> This transaction has
                  been successfully completed.
                  {isSeller && " Funds have been released to you."}
                  {isBuyer && " Thank you for your purchase!"}
                </p>
              </div>
            )}

            {transaction.status === "REFUNDED" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Refunded:</strong> This transaction has been refunded.
                  {isBuyer && " The funds have been returned to your account."}
                </p>
              </div>
            )}

            {transaction.status === "FAILED" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Payment Failed:</strong> The payment could not be
                  processed. Please try again or contact support.
                </p>
              </div>
            )}

            {transaction.status === "DISPUTED" && transaction.disputes.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-orange-800 font-semibold mb-1">
                      ⚠️ Dispute in Progress
                    </p>
                    <p className="text-sm text-orange-700">
                      This transaction is under dispute. An admin will review and resolve
                      the issue. You can continue the discussion below.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/disputes/${transaction.disputes[0].id}`}
                  className="inline-block mt-3 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium"
                >
                  View Dispute Details
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Review Section - Only show for completed transactions */}
        {transaction.status === "COMPLETED" && (
          <div className="mt-6">
            {transaction.reviews.length > 0 ? (
              // User has already submitted a review
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Your Review</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">
                      {transaction.reviews[0].satisfied ? "😊" : "😞"}
                    </span>
                    <div>
                      <div className="text-xl font-bold text-gray-900">
                        {transaction.reviews[0].satisfied ? "Satisfied" : "Dissatisfied"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Review for {transaction.reviews[0].reviewee.name}
                      </div>
                    </div>
                  </div>
                  {transaction.reviews[0].comment && (
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {transaction.reviews[0].comment}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Submitted on {formatDateTime(transaction.reviews[0].createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              // Show review form if no review submitted yet
              <ReviewForm
                transactionId={transaction.id}
                otherPartyName={
                  isBuyer ? transaction.seller.name : transaction.buyer.name
                }
                isBuyer={isBuyer}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
