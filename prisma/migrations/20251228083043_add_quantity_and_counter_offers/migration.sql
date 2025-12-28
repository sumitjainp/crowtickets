-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "allowCounterOffers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
