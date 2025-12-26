-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "transferNotes" TEXT,
ADD COLUMN     "transferStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transferredAt" TIMESTAMP(3),
ADD COLUMN     "transferredBy" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_transferStatus_idx" ON "Transaction"("transferStatus");
