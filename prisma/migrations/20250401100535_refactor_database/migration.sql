/*
  Warnings:

  - You are about to drop the column `maxApps` on the `ContainerInstance` table. All the data in the column will be lost.
  - You are about to drop the column `maxDatabases` on the `ContainerInstance` table. All the data in the column will be lost.
  - Added the required column `maxApps` to the `Plan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDatabases` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContainerInstance" DROP COLUMN "maxApps",
DROP COLUMN "maxDatabases";

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "maxApps" INTEGER NOT NULL,
ADD COLUMN     "maxDatabases" INTEGER NOT NULL;
