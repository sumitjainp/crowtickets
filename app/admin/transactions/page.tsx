import Link from "next/link"
import { requireAdmin } from "@/lib/admin-helpers"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDateTime } from "@/lib/utils"

async function getAllTransactions() {
  const transactions = await prisma.transaction.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  })

  return transactions
}

export default async function AdminTransactionsPage() {
  await requireAdmin()

  const transactions = await getAllTransactions()

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ESCROWED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    DISPUTED: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-red-100 text-red-800",
    FAILED: "bg-red-100 text-red-800",
  }

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
              Transaction Monitoring
            </h1>
            <p className="text-gray-600 mt-2">
              View and manage all transactions on the platform
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.listing.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/profile/${transaction.buyer.id}`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {transaction.buyer.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/profile/${transaction.seller.id}`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {transaction.seller.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          statusColors[transaction.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Link
                        href={`/transactions/${transaction.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      {transaction.status === "ESCROWED" && (
                        <>
                          <button className="text-green-600 hover:text-green-900">
                            Release
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Refund
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          Total transactions: {transactions.length} • Completed:{" "}
          {transactions.filter((t) => t.status === "COMPLETED").length} •
          Disputed: {transactions.filter((t) => t.status === "DISPUTED").length}
        </div>
      </div>
    </div>
  )
}
