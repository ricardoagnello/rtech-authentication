-- AlterTable
ALTER TABLE "User" ADD COLUMN     "signupToken" TEXT,
ADD COLUMN     "signupTokenExpiresAt" TIMESTAMP(3);
