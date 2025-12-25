import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-helpers"
import TransactionsList from "@/components/transactions/TransactionsList"

async function getUserTransactions(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      listing: true,
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

export default async function TransactionsPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/auth/signin?callbackUrl=/transactions")
  }

  const transactions = await getUserTransactions(currentUser.id)

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Transactions</h1>
          <p className="text-gray-600 mt-2">
            View and manage your purchase and sales history
          </p>
        </div>

        <TransactionsList
          transactions={transactions}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  )
}
