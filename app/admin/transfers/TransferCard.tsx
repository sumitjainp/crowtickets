"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDateTime } from "@/lib/utils"

const PLATFORM_URLS: Record<string, string> = {
  TICKETMASTER: "https://www.ticketmaster.com/my-tickets",
  AXS: "https://www.axs.com/my-events",
  STUBHUB: "https://www.stubhub.com/my-tickets",
  SEATGEEK: "https://seatgeek.com/account/tickets",
  VIVID_SEATS: "https://www.vividseats.com/my-account/orders",
  GAMETIME: "https://gametime.co/orders",
}

const PLATFORM_LABELS: Record<string, string> = {
  TICKETMASTER: "Ticketmaster",
  AXS: "AXS",
  STUBHUB: "StubHub",
  SEATGEEK: "SeatGeek",
  VIVID_SEATS: "Vivid Seats",
  GAMETIME: "Gametime",
}

interface TransferCardProps {
  transfer: any
}

export default function TransferCard({ transfer }: TransferCardProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFailDialog, setShowFailDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [failReason, setFailReason] = useState("")
  const [completeNotes, setCompleteNotes] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { listing, buyer, seller } = transfer
  const platformUrl = PLATFORM_URLS[listing.ticketType] || "#"
  const platformLabel = PLATFORM_LABELS[listing.ticketType] || listing.ticketType

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleMarkComplete = async () => {
    if (!completeNotes.trim()) {
      alert("Please provide confirmation details")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/transfers/${transfer.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: completeNotes }),
      })

      if (response.ok) {
        router.refresh()
        setShowCompleteDialog(false)
      } else {
        alert("Failed to mark transfer as complete")
      }
    } catch (error) {
      alert("Error marking transfer as complete")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkFailed = async () => {
    if (!failReason.trim()) {
      alert("Please provide a reason")
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/transfers/${transfer.id}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failReason }),
      })

      if (response.ok) {
        router.refresh()
        setShowFailDialog(false)
      } else {
        alert("Failed to mark transfer as failed")
      }
    } catch (error) {
      alert("Error marking transfer as failed")
    } finally {
      setIsProcessing(false)
    }
  }

  const timeSinceSale = () => {
    const now = new Date()
    const created = new Date(transfer.createdAt)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000)

    if (diffMinutes < 60) return `${diffMinutes} min ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hrs ago`
    return `${Math.floor(diffMinutes / 1440)} days ago`
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-600 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {listing.title}
              </h3>
              <p className="text-sm text-gray-600">
                {listing.eventName} • {listing.venue}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(listing.eventDate)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {platformLabel}
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {timeSinceSale()}
              </span>
            </div>
          </div>

          {/* Transfer Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Transfer Code */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Code:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-purple-300 text-purple-900 font-mono font-bold text-lg">
                  {listing.transferCode}
                </code>
                <button
                  onClick={() => copyToClipboard(listing.transferCode, "code")}
                  className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-semibold whitespace-nowrap"
                >
                  {copiedField === "code" ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>

            {/* Buyer Email */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer TO (Buyer):
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white px-3 py-2 rounded border border-green-300">
                  <div className="font-semibold text-gray-900">{buyer.name}</div>
                  <div className="text-sm text-gray-600">{buyer.email}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(buyer.email, "email")}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold whitespace-nowrap"
                >
                  {copiedField === "email" ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>

            {/* Escrow Email */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer FROM (Escrow):
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-blue-300 text-blue-900 font-mono text-sm">
                  {listing.escrowEmail}
                </code>
                <button
                  onClick={() => copyToClipboard(listing.escrowEmail, "escrow")}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold whitespace-nowrap"
                >
                  {copiedField === "escrow" ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>

            {/* Transaction Amount */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Details:
              </label>
              <div className="bg-white px-3 py-2 rounded border border-gray-300">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(transfer.amount)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Sold: {timeSinceSale()}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.open(platformUrl, "_blank")}
              className="flex-1 min-w-[200px] bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
            >
              🎫 Open {platformLabel}
            </button>

            <button
              onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox`, "_blank")}
              className="flex-1 min-w-[200px] bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 font-semibold flex items-center justify-center gap-2"
            >
              📧 Open Gmail
            </button>

            <button
              onClick={() => setShowCompleteDialog(true)}
              disabled={isProcessing}
              className="flex-1 min-w-[200px] bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "✓ Mark Complete"}
            </button>

            <button
              onClick={() => setShowFailDialog(true)}
              disabled={isProcessing}
              className="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold disabled:opacity-50"
            >
              ✗ Mark Failed
            </button>
          </div>

          {/* Quick Instructions */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              📝 Quick Instructions:
            </h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Click "Open {platformLabel}" → Log in to escrow account</li>
              <li>Find ticket with code: <strong>{listing.transferCode}</strong></li>
              <li>Click "Transfer Tickets"</li>
              <li>Enter buyer email: <strong>{buyer.email}</strong></li>
              <li>Send transfer → Return here → Click "Mark Complete"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Complete Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Transfer Complete
            </h3>
            <p className="text-gray-700 mb-4">
              Please confirm you have completed the transfer and provide details:
            </p>
            <textarea
              value={completeNotes}
              onChange={(e) => setCompleteNotes(e.target.value)}
              placeholder="E.g., Transfer completed successfully via Ticketmaster at 3:45pm. Confirmation email received. Screenshot saved."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32"
            />
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Only mark as complete if you have successfully transferred the tickets to <strong>{buyer.email}</strong> and received confirmation from the platform.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompleteDialog(false)
                  setCompleteNotes("")
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                disabled={isProcessing || !completeNotes.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Confirm Complete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Dialog */}
      {showFailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Mark Transfer as Failed
            </h3>
            <p className="text-gray-700 mb-4">
              Why did the transfer fail?
            </p>
            <textarea
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="E.g., Ticket not found in escrow account, buyer email invalid, platform error..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 h-32"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFailDialog(false)
                  setFailReason("")
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkFailed}
                disabled={isProcessing || !failReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Mark as Failed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
