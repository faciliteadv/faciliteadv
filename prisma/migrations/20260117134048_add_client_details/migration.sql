-- AlterEnum
ALTER TYPE "ProcessStatus" ADD VALUE 'EXTINCT_WITH_JUDGMENT';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "messageContactName" TEXT,
ADD COLUMN     "messageContactRelation" TEXT,
ADD COLUMN     "motherName" TEXT;

-- DropEnum
DROP TYPE "CasePhase";

-- DropEnum
DROP TYPE "INSSActionType";

-- DropEnum
DROP TYPE "INSSPhase";

-- DropEnum
DROP TYPE "PracticeArea";

-- DropEnum
DROP TYPE "TaskPhase";
