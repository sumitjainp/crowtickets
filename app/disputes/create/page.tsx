import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import CreateDisputeForm from "@/components/disputes/CreateDisputeForm"

async function getTransaction(transactionId: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
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
  })

  // Check authorization
  if (
    !transaction ||
    (transaction.buyerId !== userId && transaction.sellerId !== userId)
  ) {
    return null
  }

  return transaction
}

export default async function CreateDisputePage({
  searchParams,
}: {
  searchParams: Promise<{ transactionId?: string }>
}) {
  const params = await searchParams
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/disputes/create")
  }

  if (!params.transactionId) {
    redirect("/transactions")
  }

  const transaction = await getTransaction(params.transactionId, currentUser.id)

  if (!transaction) {
    redirect("/transactions")
  }

  if (transaction.status !== "ESCROWED") {
    redirect(`/transactions/${transaction.id}`)
  }

  const otherParty =
    transaction.buyerId === currentUser.id
      ? transaction.seller
      : transaction.buyer

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Raise a Dispute</h1>
          <p className="text-gray-600 mt-2">
            Explain the issue with this transaction. An admin will review and help
            resolve it.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Transaction Details</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Listing:</span>{" "}
              <span className="font-medium">{transaction.listing.title}</span>
            </div>
            <div>
              <span className="text-gray-600">Other Party:</span>{" "}
              <span className="font-medium">{otherParty.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Amount:</span>{" "}
              <span className="font-medium">${transaction.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <CreateDisputeForm
          transactionId={transaction.id}
          listingTitle={transaction.listing.title}
        />
      </div>
    </div>
  )
}
