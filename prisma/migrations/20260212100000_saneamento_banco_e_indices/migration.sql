-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('INCOME', 'EXPENSE');

-- AlterTable FinancialRecord (Safe Migration)
ALTER TABLE "FinancialRecord" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "FinancialRecord" ALTER COLUMN "type" TYPE "FinancialType" USING "type"::text::"FinancialType";

-- DropForeignKey (Orphans)
ALTER TABLE "CaseCard" DROP CONSTRAINT "CaseCard_userId_fkey";
ALTER TABLE "CaseChecklistItem" DROP CONSTRAINT "CaseChecklistItem_caseId_fkey";
ALTER TABLE "INSSCase" DROP CONSTRAINT "INSSCase_userId_fkey";
ALTER TABLE "INSSChecklistItem" DROP CONSTRAINT "INSSChecklistItem_inssId_fkey";

-- DropTable (Orphans)
DROP TABLE "CaseCard";
DROP TABLE "CaseChecklistItem";
DROP TABLE "INSSCase";
DROP TABLE "INSSChecklistItem";

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");
CREATE INDEX "FinancialRecord_clientId_idx" ON "FinancialRecord"("clientId");
CREATE INDEX "FinancialRecord_userId_idx" ON "FinancialRecord"("userId");
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");
CREATE INDEX IF NOT EXISTS "TaskCard_columnId_position_idx" ON "TaskCard"("columnId", "position");
CREATE INDEX "TaskCard_workspaceId_columnId_idx" ON "TaskCard"("workspaceId", "columnId");

-- Helper to drop default if needed (from original diff, mostly safe to ignore defaults drop on IDs if not changing type, but let's include for clean state if Prisma wants it)
-- Omitting the noisy DropForeignKey/AddForeignKey for ID columns unless strictly needed. Prisma diff usually adds them when it's unsure about constraints names.
-- Since we are migrating manually, we focus on the structural changes.
