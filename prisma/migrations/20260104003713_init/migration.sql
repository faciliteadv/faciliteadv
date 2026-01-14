-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('NEW_LEAD', 'NEGOTIATING', 'CONVERTED', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProcessStatus" AS ENUM ('CONSTRUCTION', 'ACTIVE', 'APPEAL', 'SETTLEMENT', 'ARCHIVED', 'EXTINCT');

-- CreateEnum
CREATE TYPE "TaskPhase" AS ENUM ('TODO', 'DOING', 'REVIEW', 'REFACTOR', 'WAITING_DOCS', 'PROTOCOL', 'PROTOCOLLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DEADLINE', 'INTERNAL');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxClients" INTEGER,
    "maxProcesses" INTEGER,
    "maxStorageMB" INTEGER,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'PF',
    "name" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "rg" TEXT,
    "ctps" TEXT,
    "pis" TEXT,
    "govAccessPassword" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "address" JSONB,
    "contacts" JSONB,
    "acquisitionChannel" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'NEW_LEAD',
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "folderName" TEXT,
    "number" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "subject" TEXT,
    "courtLink" TEXT,
    "status" "ProcessStatus" NOT NULL DEFAULT 'ACTIVE',
    "distributionDate" TIMESTAMP(3),
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'INTERNAL',
    "phase" "TaskPhase" NOT NULL DEFAULT 'TODO',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "fatalDate" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT,
    "processId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRecord" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "processId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TagToTaskCard" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_cpfCnpj_idx" ON "Client"("cpfCnpj");

-- CreateIndex
CREATE INDEX "Process_userId_idx" ON "Process"("userId");

-- CreateIndex
CREATE INDEX "Process_clientId_idx" ON "Process"("clientId");

-- CreateIndex
CREATE INDEX "TaskCard_userId_idx" ON "TaskCard"("userId");

-- CreateIndex
CREATE INDEX "TaskCard_fatalDate_idx" ON "TaskCard"("fatalDate");

-- CreateIndex
CREATE INDEX "TaskCard_phase_idx" ON "TaskCard"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTaskCard_AB_unique" ON "_TagToTaskCard"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTaskCard_B_index" ON "_TagToTaskCard"("B");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Process" ADD CONSTRAINT "Process_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRecord" ADD CONSTRAINT "FinancialRecord_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTaskCard" ADD CONSTRAINT "_TagToTaskCard_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTaskCard" ADD CONSTRAINT "_TagToTaskCard_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
