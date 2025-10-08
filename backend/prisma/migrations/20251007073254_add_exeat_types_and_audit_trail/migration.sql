-- CreateEnum
CREATE TYPE "public"."ExeatType" AS ENUM ('SINGLE_DAY', 'OVERNIGHT', 'WEEKEND', 'EMERGENCY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Status" ADD VALUE 'CANCELED';
ALTER TYPE "public"."Status" ADD VALUE 'AWAITING_INFO';

-- AlterTable
ALTER TABLE "public"."ExeatRequest" ADD COLUMN     "actionedAt" TIMESTAMP(3),
ADD COLUMN     "actionedById" INTEGER,
ADD COLUMN     "type" "public"."ExeatType" NOT NULL DEFAULT 'OVERNIGHT';

-- AddForeignKey
ALTER TABLE "public"."ExeatRequest" ADD CONSTRAINT "ExeatRequest_actionedById_fkey" FOREIGN KEY ("actionedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
