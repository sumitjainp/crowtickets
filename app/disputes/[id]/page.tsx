import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import { formatDateTime, formatCurrency } from "@/lib/utils"
import DisputeMessages from "@/components/disputes/DisputeMessages"

async function getDispute(id: string, userId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      transaction: {
        include: {
          listing: {
            select: {
              title: true,
            },
          },
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
        },
      },
      raiser: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  // Check authorization
  if (
    !dispute ||
    (dispute.transaction.buyerId !== userId &&
      dispute.transaction.sellerId !== userId)
  ) {
    return null
  }

  return dispute
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/disputes/" + id)
  }

  const dispute = await getDispute(id, currentUser.id)

  if (!dispute) {
    notFound()
  }

  const isBuyer = currentUser.id === dispute.transaction.buyerId
  const otherParty = isBuyer
    ? dispute.transaction.seller
    : dispute.transaction.buyer

  const statusColors: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    INVESTIGATING: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <Link
          href="/disputes"
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-6"
        >
          ← Back to Disputes
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Dispute Details
                    </h1>
                    <p className="text-sm text-gray-600">ID: {dispute.id}</p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full font-semibold ${
                      statusColors[dispute.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {dispute.status}
                  </span>
                </div>
              </div>

              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold mb-3">Reason for Dispute</h2>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {dispute.reason}
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Raised By</div>
                    <div className="font-semibold">
                      {dispute.raiser.name}
                      {dispute.raisedBy === currentUser.id && (
                        <span className="ml-2 text-xs text-blue-600">(You)</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Date Raised</div>
                    <div className="font-semibold">
                      {formatDateTime(dispute.createdAt)}
                    </div>
                  </div>
                  {dispute.resolvedAt && (
                    <>
                      <div>
                        <div className="text-gray-600 mb-1">Resolved On</div>
                        <div className="font-semibold">
                          {formatDateTime(dispute.resolvedAt)}
                        </div>
                      </div>
                      {dispute.resolution && (
                        <div className="col-span-2">
                          <div className="text-gray-600 mb-1">Resolution</div>
                          <div className="font-semibold bg-green-50 p-3 rounded-lg">
                            {dispute.resolution}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <DisputeMessages
              disputeId={dispute.id}
              initialMessages={dispute.messages}
              currentUserId={currentUser.id}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Transaction Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">Transaction Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Listing</div>
                  <Link
                    href={`/listings/${dispute.transaction.listingId}`}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {dispute.transaction.listing.title}
                  </Link>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Amount</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(dispute.transaction.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Transaction Status</div>
                  <div className="font-semibold">
                    {dispute.transaction.status}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <Link
                    href={`/transactions/${dispute.transaction.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Transaction Details →
                  </Link>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Parties Involved</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Buyer</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {dispute.transaction.buyer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {dispute.transaction.buyer.name}
                        {isBuyer && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Seller</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {dispute.transaction.seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {dispute.transaction.seller.name}
                        {!isBuyer && (
                          <span className="ml-2 text-xs text-purple-600">(You)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
