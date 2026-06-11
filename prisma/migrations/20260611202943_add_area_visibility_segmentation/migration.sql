-- CreateEnum
CREATE TYPE "VisibilityScope" AS ENUM ('SELF', 'AREA', 'ALL');

-- CreateTable WorkspaceArea
CREATE TABLE "WorkspaceArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceArea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceArea_workspaceId_name_key" ON "WorkspaceArea"("workspaceId", "name");
CREATE INDEX "WorkspaceArea_workspaceId_idx" ON "WorkspaceArea"("workspaceId");

ALTER TABLE "WorkspaceArea" ADD CONSTRAINT "WorkspaceArea_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable WorkspaceMember: add areaId and visibilityScope
ALTER TABLE "WorkspaceMember" ADD COLUMN "areaId" TEXT;
ALTER TABLE "WorkspaceMember" ADD COLUMN "visibilityScope" "VisibilityScope" NOT NULL DEFAULT 'AREA';

CREATE INDEX "WorkspaceMember_workspaceId_areaId_idx" ON "WorkspaceMember"("workspaceId", "areaId");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_areaId_fkey"
    FOREIGN KEY ("areaId") REFERENCES "WorkspaceArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable MemberVisibilityGrant
CREATE TABLE "MemberVisibilityGrant" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberVisibilityGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberVisibilityGrant_viewerId_targetId_key" ON "MemberVisibilityGrant"("viewerId", "targetId");
CREATE INDEX "MemberVisibilityGrant_viewerId_idx" ON "MemberVisibilityGrant"("viewerId");
CREATE INDEX "MemberVisibilityGrant_targetId_idx" ON "MemberVisibilityGrant"("targetId");
CREATE INDEX "MemberVisibilityGrant_workspaceId_idx" ON "MemberVisibilityGrant"("workspaceId");

ALTER TABLE "MemberVisibilityGrant" ADD CONSTRAINT "MemberVisibilityGrant_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MemberVisibilityGrant" ADD CONSTRAINT "MemberVisibilityGrant_viewerId_fkey"
    FOREIGN KEY ("viewerId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemberVisibilityGrant" ADD CONSTRAINT "MemberVisibilityGrant_targetId_fkey"
    FOREIGN KEY ("targetId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: composite AuditLog index for kanban comment queries
CREATE INDEX "AuditLog_entityType_action_entityId_idx" ON "AuditLog"("entityType", "action", "entityId");
