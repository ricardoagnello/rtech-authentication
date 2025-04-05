/*
  Warnings:

  - You are about to drop the column `diskRead` on the `ContainerMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `diskWrite` on the `ContainerMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `networkRx` on the `ContainerMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `networkTx` on the `ContainerMetrics` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `ContainerMetrics` table. All the data in the column will be lost.
  - You are about to drop the `SystemMetrics` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ContainerMetrics" DROP COLUMN "diskRead",
DROP COLUMN "diskWrite",
DROP COLUMN "networkRx",
DROP COLUMN "networkTx",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "SystemMetrics";
