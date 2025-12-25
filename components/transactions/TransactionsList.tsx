"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCurrency, formatDateTime } from "@/lib/utils"

type Transaction = {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  amount: number
  status: string
  createdAt: Date
  listing: {
    id: string
    title: string
    eventName: string
  }
  buyer: {
    id: string
    name: string
  }
  seller: {
    id: string
    name: string
  }
}

type Props = {
  transactions: Transaction[]
  currentUserId: string
}

export default function TransactionsList({
  transactions,
  currentUserId,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "active" | "completed" | "voided"
  >("all")
  const [timeframe, setTimeframe] = useState<
    "7d" | "30d" | "3m" | "6m" | "1y" | "all"
  >("all")

  // Helper function to get display status
  const getDisplayStatus = (status: string) => {
    if (status === "FAILED" || status === "REFUNDED") return "Voided"
    return status.charAt(0) + status.slice(1).toLowerCase()
  }

  // Filter by timeframe
  const getTimeframeDate = () => {
    const now = new Date()
    switch (timeframe) {
      case "7d":
        return new Date(now.setDate(now.getDate() - 7))
      case "30d":
        return new Date(now.setDate(now.getDate() - 30))
      case "3m":
        return new Date(now.setMonth(now.getMonth() - 3))
      case "6m":
        return new Date(now.setMonth(now.getMonth() - 6))
      case "1y":
        return new Date(now.setFullYear(now.getFullYear() - 1))
      default:
        return null
    }
  }

  const timeframeDate = getTimeframeDate()
  const timeframeFiltered = timeframeDate
    ? transactions.filter((t) => new Date(t.createdAt) >= timeframeDate)
    : transactions

  // Categorize transactions (after timeframe filter)
  const pending = timeframeFiltered.filter((t) => t.status === "PENDING")
  const active = timeframeFiltered.filter((t) => t.status === "ESCROWED")
  const completed = timeframeFiltered.filter((t) => t.status === "COMPLETED")
  const voided = timeframeFiltered.filter(
    (t) => t.status === "FAILED" || t.status === "REFUNDED"
  )

  // Get transactions based on active tab
  const getFilteredTransactions = () => {
    switch (activeTab) {
      case "pending":
        return pending
      case "active":
        return active
      case "completed":
        return completed
      case "voided":
        return voided
      default:
        return timeframeFiltered
    }
  }

  const filteredTransactions = getFilteredTransactions()

  // Status badge colors
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ESCROWED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    REFUNDED: "bg-gray-100 text-gray-600",
    DISPUTED: "bg-orange-100 text-orange-800",
    FAILED: "bg-gray-100 text-gray-600",
  }

  // Tab counts (with timeframe filter applied)
  const counts = {
    all: timeframeFiltered.length,
    pending: pending.length,
    active: active.length,
    completed: completed.length,
    voided: voided.length,
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No Transactions Yet
        </h2>
        <p className="text-gray-600 mb-6">
          You haven't made any purchases or sales yet.
        </p>
        <Link
          href="/listings"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Browse Listings
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Timeframe Filter */}
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredTransactions.length}
          </span>{" "}
          {filteredTransactions.length === 1 ? "transaction" : "transactions"}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Timeframe:</label>
          <select
            value={timeframe}
            onChange={(e) =>
              setTimeframe(
                e.target.value as "7d" | "30d" | "3m" | "6m" | "1y" | "all"
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              All
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              Pending
              {counts.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("active")}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "active"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              Active (Escrowed)
              {counts.active > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {counts.active}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "completed"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              Completed
              {counts.completed > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                  {counts.completed}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("voided")}
              className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "voided"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              Voided
              {counts.voided > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                  {counts.voided}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Transactions list */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab === "all" ? "" : activeTab} transactions
          </h3>
          <p className="text-gray-600">
            {activeTab === "pending" &&
              "You don't have any pending transactions."}
            {activeTab === "active" &&
              "You don't have any active (escrowed) transactions."}
            {activeTab === "completed" &&
              "You haven't completed any transactions yet."}
            {activeTab === "voided" && "You don't have any voided transactions."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => {
            const isBuyer = currentUserId === transaction.buyerId
            const statusColor =
              statusColors[transaction.status] || "bg-gray-100 text-gray-800"
            const isVoided =
              transaction.status === "FAILED" ||
              transaction.status === "REFUNDED"

            return (
              <Link
                key={transaction.id}
                href={`/transactions/${transaction.id}`}
                className={`block bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                  isVoided ? "opacity-75" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-4 flex-1">
                      <div
                        className={`w-20 h-20 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isVoided
                            ? "bg-gray-200"
                            : "bg-gradient-to-br from-blue-500 to-purple-600"
                        }`}
                      >
                        <span className="text-3xl">
                          {isVoided ? "❌" : "🎫"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {transaction.listing.title}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Event: {transaction.listing.eventName}</div>
                          <div>
                            {isBuyer ? "Seller" : "Buyer"}:{" "}
                            {isBuyer
                              ? transaction.seller.name
                              : transaction.buyer.name}
                          </div>
                          <div>{formatDateTime(transaction.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold mb-2 ${
                          isVoided ? "text-gray-400" : "text-blue-600"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${statusColor}`}
                      >
                        {getDisplayStatus(transaction.status)}
                      </span>
                      <div className="text-xs text-gray-500 mt-2">
                        {isBuyer ? "Purchase" : "Sale"}
                      </div>
                    </div>
                  </div>

                  {transaction.status === "ESCROWED" && isBuyer && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        ⚠️ Action required: Confirm receipt of ticket to release
                        funds
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
