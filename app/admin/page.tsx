import Link from "next/link"
import { requireAdmin } from "@/lib/admin-helpers"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

async function getAdminStats() {
  const [
    totalUsers,
    totalListings,
    activeListings,
    totalTransactions,
    completedTransactions,
    disputedTransactions,
    openDisputes,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { status: "COMPLETED" } }),
    prisma.transaction.count({ where: { status: "DISPUTED" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ])

  return {
    totalUsers,
    totalListings,
    activeListings,
    totalTransactions,
    completedTransactions,
    disputedTransactions,
    openDisputes,
    totalRevenue: totalRevenue._sum.amount || 0,
  }
}

async function getRecentActivity() {
  const [recentUsers, recentListings, recentTransactions, recentDisputes] =
    await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.listing.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            select: {
              title: true,
            },
          },
          buyer: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.dispute.findMany({
        take: 5,
        where: {
          status: { in: ["OPEN", "INVESTIGATING"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          transaction: {
            include: {
              listing: {
                select: {
                  title: true,
                },
              },
            },
          },
          raiser: {
            select: {
              name: true,
            },
          },
        },
      }),
    ])

  return {
    recentUsers,
    recentListings,
    recentTransactions,
    recentDisputes,
  }
}

export default async function AdminDashboardPage() {
  await requireAdmin()

  const stats = await getAdminStats()
  const activity = await getRecentActivity()

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-blue-50 text-blue-600",
      link: "/admin/users",
    },
    {
      title: "Active Listings",
      value: `${stats.activeListings} / ${stats.totalListings}`,
      icon: "🎫",
      color: "bg-purple-50 text-purple-600",
      link: "/admin/listings",
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions,
      icon: "💰",
      color: "bg-green-50 text-green-600",
      link: "/admin/transactions",
    },
    {
      title: "Open Disputes",
      value: stats.openDisputes,
      icon: "⚠️",
      color: "bg-orange-50 text-orange-600",
      link: "/admin/disputes",
    },
    {
      title: "Completed Sales",
      value: stats.completedTransactions,
      icon: "✅",
      color: "bg-teal-50 text-teal-600",
      link: "/admin/transactions",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: "💵",
      color: "bg-indigo-50 text-indigo-600",
      link: "/admin/transactions",
    },
  ]

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your escrow platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.link}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border border-gray-200 hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-4xl ${stat.color} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Disputes */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Disputes</h2>
              <Link
                href="/admin/disputes"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="divide-y">
              {activity.recentDisputes.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No active disputes
                </div>
              ) : (
                activity.recentDisputes.map((dispute) => (
                  <Link
                    key={dispute.id}
                    href={`/admin/disputes/${dispute.id}`}
                    className="block p-4 hover:bg-gray-50 transition"
                  >
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {dispute.transaction.listing.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      Raised by {dispute.raiser.name} •{" "}
                      <span
                        className={`${
                          dispute.status === "OPEN"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Link
                href="/admin/transactions"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="divide-y">
              {activity.recentTransactions.map((transaction) => (
                <Link
                  key={transaction.id}
                  href={`/admin/transactions/${transaction.id}`}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {transaction.listing.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {transaction.buyer.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div
                        className={`text-xs ${
                          transaction.status === "COMPLETED"
                            ? "text-green-600"
                            : transaction.status === "DISPUTED"
                            ? "text-orange-600"
                            : "text-blue-600"
                        }`}
                      >
                        {transaction.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
            >
              <span className="text-2xl">👥</span>
              <span className="font-medium text-gray-900">Manage Users</span>
            </Link>
            <Link
              href="/admin/listings"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition"
            >
              <span className="text-2xl">🎫</span>
              <span className="font-medium text-gray-900">Review Listings</span>
            </Link>
            <Link
              href="/admin/disputes"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition"
            >
              <span className="text-2xl">⚖️</span>
              <span className="font-medium text-gray-900">Resolve Disputes</span>
            </Link>
            <Link
              href="/admin/transactions"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition"
            >
              <span className="text-2xl">💳</span>
              <span className="font-medium text-gray-900">View Transactions</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
