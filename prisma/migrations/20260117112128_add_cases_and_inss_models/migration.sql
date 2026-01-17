-- CreateEnum
CREATE TYPE "CasePhase" AS ENUM ('NEW_LEAD', 'NEGOTIATING', 'SEND_CONTRACT', 'WAITING_SIGNATURE', 'WAITING_DOCS', 'TODO', 'DOING', 'REVIEW', 'REFACTOR', 'DISTRIBUTE', 'DISTRIBUTED');

-- CreateEnum
CREATE TYPE "INSSPhase" AS ENUM ('NEW_CASE', 'WAITING_SIGNATURES', 'WAITING_DOCS', 'TODO', 'DOING', 'REVIEW', 'REFACTOR', 'FILE', 'AWAITING_RESULT', 'APPROVED', 'DENIED', 'ADMIN_APPEAL', 'JUDICIAL_ACTION');

-- CreateEnum
CREATE TYPE "PracticeArea" AS ENUM ('LABOR', 'CIVIL', 'FAMILY', 'CRIMINAL', 'SOCIAL_SECURITY', 'TAX', 'OTHER');

-- CreateEnum
CREATE TYPE "INSSActionType" AS ENUM ('MATERNITY_ASSISTANCE', 'RETIREMENT_AGE', 'RETIREMENT_CONTRIBUTION', 'DISABILITY_RETIREMENT', 'SICKNESS_BENEFIT', 'ACCIDENT_AID', 'BPC_LOAS', 'REVIEW', 'OTHER');

-- CreateTable
CREATE TABLE "CaseCard" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "defendantName" TEXT,
    "practiceArea" "PracticeArea" NOT NULL DEFAULT 'OTHER',
    "phase" "CasePhase" NOT NULL DEFAULT 'NEW_LEAD',
    "deadline" TIMESTAMP(3),
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseChecklistItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "INSSCase" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientCpf" TEXT,
    "govPassword" TEXT,
    "actionType" "INSSActionType" NOT NULL DEFAULT 'OTHER',
    "phase" "INSSPhase" NOT NULL DEFAULT 'NEW_CASE',
    "deadline" TIMESTAMP(3),
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "INSSCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "INSSChecklistItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "inssId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "INSSChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseCard_userId_idx" ON "CaseCard"("userId");

-- CreateIndex
CREATE INDEX "CaseCard_phase_idx" ON "CaseCard"("phase");

-- CreateIndex
CREATE INDEX "CaseCard_deadline_idx" ON "CaseCard"("deadline");

-- CreateIndex
CREATE INDEX "CaseChecklistItem_caseId_idx" ON "CaseChecklistItem"("caseId");

-- CreateIndex
CREATE INDEX "INSSCase_userId_idx" ON "INSSCase"("userId");

-- CreateIndex
CREATE INDEX "INSSCase_phase_idx" ON "INSSCase"("phase");

-- CreateIndex
CREATE INDEX "INSSCase_deadline_idx" ON "INSSCase"("deadline");

-- CreateIndex
CREATE INDEX "INSSChecklistItem_inssId_idx" ON "INSSChecklistItem"("inssId");

-- AddForeignKey
ALTER TABLE "CaseCard" ADD CONSTRAINT "CaseCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseChecklistItem" ADD CONSTRAINT "CaseChecklistItem_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CaseCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INSSCase" ADD CONSTRAINT "INSSCase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INSSChecklistItem" ADD CONSTRAINT "INSSChecklistItem_inssId_fkey" FOREIGN KEY ("inssId") REFERENCES "INSSCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
