import Link from "next/link"
import { requireAdmin } from "@/lib/admin-helpers"
import { prisma } from "@/lib/prisma"
import { formatDateTime } from "@/lib/utils"

async function getAllUsers() {
  const users = await prisma.user.findMany({
    include: {
      profile: true,
      _count: {
        select: {
          listingsAsSeller: true,
          transactionsAsBuyer: true,
          transactionsAsSeller: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return users
}

export default async function AdminUsersPage() {
  await requireAdmin()

  const users = await getAllUsers()

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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              View and manage all users on the platform
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.profile && user.profile.reviewCount > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            👍 {Math.round(user.profile.satisfactionScore)}%
                          </div>
                          <div className="text-gray-500">
                            {user.profile.reviewCount} reviews
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>
                          {user._count.listingsAsSeller} listings
                        </div>
                        <div className="text-gray-500">
                          {user._count.transactionsAsBuyer} buys •{" "}
                          {user._count.transactionsAsSeller} sales
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/profile/${user.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View Profile
                      </Link>
                      {user.role !== "ADMIN" && (
                        <button className="text-red-600 hover:text-red-900">
                          Ban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          Total users: {users.length}
        </div>
      </div>
    </div>
  )
}
