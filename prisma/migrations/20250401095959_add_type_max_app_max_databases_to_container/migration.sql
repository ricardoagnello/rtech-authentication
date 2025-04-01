/*
  Warnings:

  - Added the required column `maxApps` to the `ContainerInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxDatabases` to the `ContainerInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ContainerInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContainerInstance" ADD COLUMN     "maxApps" INTEGER NOT NULL,
ADD COLUMN     "maxDatabases" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL;
