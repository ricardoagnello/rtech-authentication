-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpu" INTEGER NOT NULL,
    "ram" INTEGER NOT NULL,
    "apps" INTEGER NOT NULL,
    "databases" INTEGER NOT NULL,
    "storageApp" INTEGER NOT NULL,
    "storageDB" INTEGER NOT NULL,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "priceQuarterly" DOUBLE PRECISION NOT NULL,
    "trialDays" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
