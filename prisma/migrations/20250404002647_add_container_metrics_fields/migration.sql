/*
  Warnings:

  - Added the required column `diskRead` to the `ContainerMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diskWrite` to the `ContainerMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `networkRx` to the `ContainerMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `networkTx` to the `ContainerMetrics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContainerMetrics" ADD COLUMN     "diskRead" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "diskWrite" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "networkRx" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "networkTx" DOUBLE PRECISION NOT NULL;
