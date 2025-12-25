"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ConfirmReceiptButton({
  transactionId,
}: {
  transactionId: string
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/stripe/release-funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to release funds")
      }

      // Refresh the page to show updated status
      router.refresh()
      setShowConfirmation(false)
    } catch (error) {
      console.error("Error releasing funds:", error)
      setError(
        error instanceof Error ? error.message : "Failed to release funds"
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirmation) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-2">Confirm Receipt of Ticket</h3>
        <p className="text-sm text-gray-600 mb-4">
          By confirming receipt, you acknowledge that you have received the
          ticket and the funds will be released to the seller. This action
          cannot be undone.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Yes, I Received the Ticket"}
          </button>
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            className="flex-1 border border-gray-300 py-2 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirmation(true)}
      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
    >
      Confirm Receipt & Release Funds
    </button>
  )
}
