"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatCurrency, calculateRefund, type CancellationPolicy } from "@/lib/utils"

interface Props {
  transactionId: string
  amount: number
  purchaseDate: Date
  eventDate: Date
  cancellationPolicy: CancellationPolicy
}

export default function CancelTransactionButton({
  transactionId,
  amount,
  purchaseDate,
  eventDate,
  cancellationPolicy,
}: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")

  // Calculate refund
  const refundCalc = calculateRefund(
    cancellationPolicy,
    purchaseDate,
    eventDate,
    amount
  )

  const handleCancel = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to cancel transaction")
        setIsLoading(false)
        return
      }

      // Success - refresh and close dialog
      router.refresh()
      setShowConfirm(false)
    } catch (error) {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  if (!refundCalc.canCancel) {
    return null // Don't show button if cancellation not allowed
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
      >
        Cancel Purchase
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Cancel Transaction?
            </h3>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                Are you sure you want to cancel this purchase?
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800 space-y-2">
                  <div className="flex justify-between">
                    <span>Original Amount:</span>
                    <span className="font-semibold">{formatCurrency(amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Percentage:</span>
                    <span className="font-semibold">{refundCalc.refundPercentage}%</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
                    <span className="font-semibold">You will receive:</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(refundCalc.refundAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {refundCalc.refundPercentage < 100 && (
                <p className="text-sm text-orange-600">
                  ⚠️ Note: A {100 - refundCalc.refundPercentage}% cancellation fee applies based on the listing's cancellation policy.
                </p>
              )}

              <p className="text-sm text-gray-600">
                This action cannot be undone. The listing will become available again for other buyers.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Keep Purchase
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {isLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
