-- CreateEnum
CREATE TYPE "InquiryNoteKind" AS ENUM ('NOTE', 'STATUS_CHANGE', 'ASSIGNMENT');

-- AlterTable
ALTER TABLE "InquiryNote" ADD COLUMN     "kind" "InquiryNoteKind" NOT NULL DEFAULT 'NOTE';
