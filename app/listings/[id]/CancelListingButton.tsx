"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function CancelListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCancel = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/listings/${listingId}/cancel`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh the page to show updated status
        router.refresh()
        setShowConfirm(false)
      } else {
        alert(data.error || "Failed to cancel listing")
      }
    } catch (error) {
      alert("Failed to cancel listing. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Cancel Listing?
          </h3>
          <p className="text-gray-700 mb-4">
            Are you sure you want to cancel this listing? This action will:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-6 ml-4">
            <li>• Remove your listing from the marketplace</li>
            <li>• Mark it as CANCELLED</li>
            <li>• You can still access your transfer code to reclaim tickets</li>
          </ul>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              Keep Listing
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
            >
              {isLoading ? "Cancelling..." : "Yes, Cancel"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 border border-red-300 rounded-md text-red-700 hover:bg-red-50 font-medium"
    >
      Cancel Listing
    </button>
  )
}
