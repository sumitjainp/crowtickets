import Link from "next/link"
import { requireAdmin } from "@/lib/admin-helpers"
import { prisma } from "@/lib/prisma"
import { formatDateTime } from "@/lib/utils"

async function getAllDisputes() {
  const disputes = await prisma.dispute.findMany({
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

  return disputes
}

export default async function AdminDisputesPage() {
  await requireAdmin()

  const disputes = await getAllDisputes()

  const statusColors: Record<string, string> = {
    OPEN: "bg-yellow-100 text-yellow-800",
    INVESTIGATING: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
  }

  const activeDisputes = disputes.filter((d) =>
    ["OPEN", "INVESTIGATING"].includes(d.status)
  )
  const resolvedDisputes = disputes.filter((d) => d.status === "RESOLVED")

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Dispute Resolution Center
            </h1>
            <p className="text-gray-600 mt-2">
              Review and resolve disputes between users
            </p>
          </div>
        </div>

        {/* Active Disputes */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Active Disputes ({activeDisputes.length})
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {activeDisputes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">✅</div>
                <p>No active disputes. Everything is running smoothly!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parties
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Raised By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Messages
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeDisputes.map((dispute) => (
                      <tr key={dispute.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {dispute.transaction.listing.title}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {dispute.reason}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>👤 {dispute.transaction.buyer.name}</div>
                          <div className="text-gray-500">
                            vs {dispute.transaction.seller.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dispute.raiser.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              statusColors[dispute.status] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {dispute.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          💬 {dispute._count.messages}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(dispute.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/disputes/${dispute.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Resolved Disputes */}
        {resolvedDisputes.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Recently Resolved ({resolvedDisputes.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y">
                {resolvedDisputes.slice(0, 10).map((dispute) => (
                  <Link
                    key={dispute.id}
                    href={`/disputes/${dispute.id}`}
                    className="block p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {dispute.transaction.listing.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          Resolved on {formatDateTime(dispute.resolvedAt!)}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        RESOLVED
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
