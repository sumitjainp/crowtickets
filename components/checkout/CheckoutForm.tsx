"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

function PaymentForm({
  listingId,
  clientSecret,
}: {
  listingId: string
  clientSecret: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: "if_required",
      })

      if (error) {
        setErrorMessage(error.message || "Payment failed")
        setIsProcessing(false)
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment successful, redirect to success page
        router.push(`/payment/success?payment_intent=${paymentIntent.id}`)
      }
    } catch (error) {
      console.error("Payment error:", error)
      setErrorMessage("An unexpected error occurred")
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : "Complete Purchase"}
      </button>

      <p className="mt-4 text-xs text-gray-500 text-center">
        Your payment information is securely processed by Stripe. We never
        store your card details.
      </p>
    </form>
  )
}

export default function CheckoutForm({
  listingId,
  amount,
}: {
  listingId: string
  amount: number
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Create payment intent when component mounts
    async function createPaymentIntent() {
      try {
        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ listingId }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to initialize payment")
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error("Error creating payment intent:", error)
        setError(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment"
        )
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [listingId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          Unable to initialize payment. Please try again.
        </p>
      </div>
    )
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#2563eb",
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm listingId={listingId} clientSecret={clientSecret} />
    </Elements>
  )
}
