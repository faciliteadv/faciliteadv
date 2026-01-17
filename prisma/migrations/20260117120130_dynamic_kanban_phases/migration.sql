/*
  Warnings:

  - The `practiceArea` column on the `CaseCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phase` column on the `CaseCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `actionType` column on the `INSSCase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phase` column on the `INSSCase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `phase` column on the `TaskCard` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CaseCard" DROP COLUMN "practiceArea",
ADD COLUMN     "practiceArea" TEXT NOT NULL DEFAULT 'OTHER',
DROP COLUMN "phase",
ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'NEW_LEAD';

-- AlterTable
ALTER TABLE "INSSCase" DROP COLUMN "actionType",
ADD COLUMN     "actionType" TEXT NOT NULL DEFAULT 'OTHER',
DROP COLUMN "phase",
ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'NEW_CASE';

-- AlterTable
ALTER TABLE "TaskCard" DROP COLUMN "phase",
ADD COLUMN     "phase" TEXT NOT NULL DEFAULT 'TODO';

-- CreateIndex
CREATE INDEX "CaseCard_phase_idx" ON "CaseCard"("phase");

-- CreateIndex
CREATE INDEX "INSSCase_phase_idx" ON "INSSCase"("phase");

-- CreateIndex
CREATE INDEX "TaskCard_phase_idx" ON "TaskCard"("phase");
