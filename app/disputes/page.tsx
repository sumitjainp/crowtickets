import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth-helpers"
import { formatDateTime } from "@/lib/utils"

async function getUserDisputes(userId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/disputes`, {
    headers: {
      cookie: `next-auth.session-token=${userId}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return []
  }

  return response.json()
}

export default async function DisputesPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/disputes")
  }

  // For now, we'll fetch directly from Prisma since we're in a server component
  const { prisma } = await import("@/lib/prisma")

  const disputes = await prisma.dispute.findMany({
    where: {
      transaction: {
        OR: [
          { buyerId: currentUser.id },
          { sellerId: currentUser.id },
        ],
      },
    },
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
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
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
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const statusColors: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    INVESTIGATING: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Disputes</h1>
            <p className="mt-2 text-gray-600">
              View and manage your transaction disputes
            </p>
          </div>
        </div>

        {disputes.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No disputes
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't raised any disputes. Great job keeping transactions smooth!
            </p>
            <Link
              href="/transactions"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              View Transactions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const isRaiser = dispute.raisedBy === currentUser.id
              const otherParty =
                dispute.transaction.buyerId === currentUser.id
                  ? dispute.transaction.seller
                  : dispute.transaction.buyer

              return (
                <Link
                  key={dispute.id}
                  href={`/disputes/${dispute.id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200 hover:border-blue-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {dispute.transaction.listing.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Dispute with {otherParty.name}</span>
                          <span>•</span>
                          <span>
                            {isRaiser ? "Raised by you" : `Raised by ${dispute.raiser.name}`}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full font-semibold text-sm ${
                          statusColors[dispute.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {dispute.reason}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-600">
                        <span>💬 {dispute._count.messages} messages</span>
                        <span>•</span>
                        <span>{formatDateTime(dispute.createdAt)}</span>
                      </div>
                      <span className="text-blue-600 font-medium">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
