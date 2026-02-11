-- Kanban Pipeline-First Migration
-- Run this BEFORE `prisma db push` to prevent data loss

-- Step 1: Ensure at least one pipeline exists per workspace
INSERT INTO "KanbanPipeline" (id, name, "workspaceId", position, "isDefault", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Pipeline',
  w.id,
  0,
  true,
  NOW(),
  NOW()
FROM "Workspace" w
WHERE NOT EXISTS (
  SELECT 1 FROM "KanbanPipeline" kp WHERE kp."workspaceId" = w.id AND kp."deletedAt" IS NULL
);

-- Step 2: Backfill KanbanColumn.pipelineId for orphaned columns
-- Link them to the first pipeline in the workspace of their owner
UPDATE "KanbanColumn" kc
SET "pipelineId" = (
  SELECT kp.id 
  FROM "KanbanPipeline" kp
  JOIN "WorkspaceMember" wm ON wm."workspaceId" = kp."workspaceId"
  WHERE wm."userId" = kc."userId" AND kp."deletedAt" IS NULL
  ORDER BY kp.position ASC
  LIMIT 1
)
WHERE kc."pipelineId" IS NULL;

-- Step 3: Set position = order for columns that still use legacy order
UPDATE "KanbanColumn"
SET position = "order"
WHERE position IS NULL OR position = 0;

-- Step 4: Backfill TaskCard.columnId for orphaned tasks
-- Match by phase name within the user's columns
UPDATE "TaskCard" tc
SET "columnId" = (
  SELECT kc.id
  FROM "KanbanColumn" kc
  WHERE kc."userId" = tc."userId" AND kc.name = tc.phase
  ORDER BY kc.position ASC
  LIMIT 1
)
WHERE tc."columnId" IS NULL;

-- Step 5: For tasks that STILL have NULL columnId (no matching phase),
-- assign to the first column of the user's pipeline
UPDATE "TaskCard" tc
SET "columnId" = (
  SELECT kc.id
  FROM "KanbanColumn" kc
  WHERE kc."userId" = tc."userId"
  ORDER BY kc.position ASC
  LIMIT 1
)
WHERE tc."columnId" IS NULL;

-- Step 6: Assign sequential positions to tasks within each column
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "columnId" ORDER BY "fatalDate" ASC NULLS LAST, "createdAt" ASC) - 1 as pos
  FROM "TaskCard"
  WHERE "isArchived" = false
)
UPDATE "TaskCard" tc
SET position = r.pos
FROM ranked r
WHERE tc.id = r.id;

-- Step 7: Handle duplicate pipeline names within same workspace
-- Rename duplicates by appending a number
WITH dupes AS (
  SELECT id, name, "workspaceId",
    ROW_NUMBER() OVER (PARTITION BY "workspaceId", name ORDER BY "createdAt") as rn
  FROM "KanbanPipeline"
  WHERE "deletedAt" IS NULL
)
UPDATE "KanbanPipeline" kp
SET name = kp.name || ' (' || d.rn || ')'
FROM dupes d
WHERE kp.id = d.id AND d.rn > 1;

-- Step 8: Handle duplicate column names within same pipeline
WITH dupes AS (
  SELECT id, name, "pipelineId",
    ROW_NUMBER() OVER (PARTITION BY "pipelineId", name ORDER BY "createdAt") as rn
  FROM "KanbanColumn"
  WHERE "pipelineId" IS NOT NULL
)
UPDATE "KanbanColumn" kc
SET name = kc.name || ' (' || d.rn || ')'
FROM dupes d
WHERE kc.id = d.id AND d.rn > 1;

-- Step 9: Drop legacy columns (run AFTER prisma db push succeeds)
-- ALTER TABLE "KanbanColumn" DROP COLUMN IF EXISTS "boardType";
-- ALTER TABLE "KanbanColumn" DROP COLUMN IF EXISTS "order";
-- ALTER TABLE "TaskCard" DROP COLUMN IF EXISTS "lexorank";

-- Step 10: Rename KanbanPipeline.order to position (if exists)
-- This is handled by Prisma migration
