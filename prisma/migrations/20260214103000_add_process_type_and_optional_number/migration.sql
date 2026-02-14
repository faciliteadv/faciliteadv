-- CreateEnum
CREATE TYPE "ProcessType" AS ENUM ('CASE', 'PROCESS');

-- AlterTable: Make number optional and add type with safe default
ALTER TABLE "Process" ALTER COLUMN "number" DROP NOT NULL;
ALTER TABLE "Process" ADD COLUMN "type" "ProcessType" NOT NULL DEFAULT 'PROCESS';
