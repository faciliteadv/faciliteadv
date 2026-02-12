-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('INCOME', 'EXPENSE');

-- DropForeignKey
ALTER TABLE "CaseCard" DROP CONSTRAINT "CaseCard_userId_fkey";

-- DropForeignKey
ALTER TABLE "CaseChecklistItem" DROP CONSTRAINT "CaseChecklistItem_caseId_fkey";

-- DropForeignKey
ALTER TABLE "INSSCase" DROP CONSTRAINT "INSSCase_userId_fkey";

-- DropForeignKey
ALTER TABLE "INSSChecklistItem" DROP CONSTRAINT "INSSChecklistItem_inssId_fkey";

-- DropForeignKey
ALTER TABLE "KanbanColumn" DROP CONSTRAINT "KanbanColumn_pipelineId_fkey";

-- DropForeignKey
ALTER TABLE "KanbanPipeline" DROP CONSTRAINT "KanbanPipeline_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "TaskCard" DROP CONSTRAINT "TaskCard_columnId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_roleId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "WorkspaceMember" DROP CONSTRAINT "WorkspaceMember_workspaceId_fkey";

-- DropIndex
DROP INDEX "KanbanColumn_pipelineId_idx";

-- DropIndex
DROP INDEX "TaskCard_columnId_idx";

-- AlterTable
ALTER TABLE "FinancialRecord" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "FinancialType" NOT NULL;

-- AlterTable
ALTER TABLE "KanbanPipeline" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "permissions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TaskCard" ALTER COLUMN "columnId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WorkspaceMember" ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "CaseCard";

-- DropTable
DROP TABLE "CaseChecklistItem";

-- DropTable
DROP TABLE "INSSCase";

-- DropTable
DROP TABLE "INSSChecklistItem";

-- CreateIndex
CREATE INDEX "Appointment_clientId_idx" ON "Appointment"("clientId");

-- CreateIndex
CREATE INDEX "FinancialRecord_clientId_idx" ON "FinancialRecord"("clientId");

-- CreateIndex
CREATE INDEX "FinancialRecord_userId_idx" ON "FinancialRecord"("userId");

-- CreateIndex
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");

-- CreateIndex
CREATE INDEX "TaskCard_columnId_position_idx" ON "TaskCard"("columnId", "position");

-- CreateIndex
CREATE INDEX "TaskCard_workspaceId_columnId_idx" ON "TaskCard"("workspaceId", "columnId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanPipeline" ADD CONSTRAINT "KanbanPipeline_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanColumn" ADD CONSTRAINT "KanbanColumn_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "KanbanPipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "KanbanColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

