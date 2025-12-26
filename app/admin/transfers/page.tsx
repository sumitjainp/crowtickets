import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import TransferCard from "./TransferCard"

async function getPendingTransfers() {
  const transfers = await prisma.transaction.findMany({
    where: {
      status: "COMPLETED", // Payment completed
      transferStatus: "PENDING", // But transfer not done yet
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          eventName: true,
          venue: true,
          eventDate: true,
          transferCode: true,
          escrowEmail: true,
          ticketType: true,
          verificationStatus: true,
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
    orderBy: {
      createdAt: "asc", // Oldest first (FIFO)
    },
  })

  return transfers
}

async function getRecentTransfers() {
  const transfers = await prisma.transaction.findMany({
    where: {
      transferStatus: {
        in: ["COMPLETED", "FAILED"],
      },
    },
    include: {
      listing: {
        select: {
          title: true,
          transferCode: true,
        },
      },
      buyer: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      transferredAt: "desc",
    },
    take: 10,
  })

  return transfers
}

export default async function AdminTransfersPage() {
  const user = await requireAuth()

  // Only admins can access this page
  if (user.role !== "ADMIN") {
    redirect("/")
  }

  const pending = await getPendingTransfers()
  const recent = await getRecentTransfers()

  const todayTransfers = recent.filter((t) => {
    if (!t.transferredAt) return false
    const today = new Date().toDateString()
    return t.transferredAt.toDateString() === today
  })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Transfer Queue
          </h1>
          <p className="mt-2 text-gray-600">
            Manage ticket transfers to buyers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Pending Transfers</div>
            <div className="text-3xl font-bold text-blue-600">
              {pending.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Completed Today</div>
            <div className="text-3xl font-bold text-green-600">
              {todayTransfers.filter((t) => t.transferStatus === "COMPLETED").length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Failed Today</div>
            <div className="text-3xl font-bold text-red-600">
              {todayTransfers.filter((t) => t.transferStatus === "FAILED").length}
            </div>
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending ({pending.length})
          </h2>

          {pending.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600">
                No pending transfers at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((transfer) => (
                <TransferCard key={transfer.id} transfer={transfer} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Transfers */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Transfers
          </h2>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Transfer Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Buyer Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recent.map((transfer) => (
                  <tr key={transfer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {transfer.listing.transferCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transfer.listing.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transfer.buyer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transfer.transferStatus === "COMPLETED" ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          ✗ Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {transfer.transferredAt
                        ? new Date(transfer.transferredAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
