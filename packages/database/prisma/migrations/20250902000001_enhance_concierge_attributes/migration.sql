-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CONCIERGE_MANAGER';

-- Create enum for attribute field types
DO $$ BEGIN
 CREATE TYPE "AttributeFieldType" AS ENUM ('string', 'number', 'boolean', 'date', 'json', 'relationship', 'select', 'multiselect', 'quantity', 'money', 'file', 'url', 'email', 'phone', 'location', 'richtext', 'time', 'duration', 'percentage', 'rating');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "ConciergeAttribute" ADD COLUMN "relationshipValue" TEXT;
ALTER TABLE "ConciergeAttribute" ADD COLUMN "selectValue" TEXT;
ALTER TABLE "ConciergeAttribute" ADD COLUMN "fileValue" TEXT;
ALTER TABLE "ConciergeAttribute" ADD COLUMN "quantityUnit" TEXT;
ALTER TABLE "ConciergeAttribute" ADD COLUMN "moneyValue" DECIMAL(15,4);
ALTER TABLE "ConciergeAttribute" ADD COLUMN "moneyCurrency" TEXT DEFAULT 'USD';

-- CreateTable
CREATE TABLE "PlaybookExecution" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "results" JSONB,
    "errors" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlaybookExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaybookExecution_playbookId_status_idx" ON "PlaybookExecution"("playbookId", "status");

-- CreateIndex  
CREATE INDEX "PlaybookExecution_objectId_startedAt_idx" ON "PlaybookExecution"("objectId", "startedAt");

-- AddForeignKey
ALTER TABLE "PlaybookExecution" ADD CONSTRAINT "PlaybookExecution_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookExecution" ADD CONSTRAINT "PlaybookExecution_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ConciergeObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add constraint to ensure exactly one value is set per attribute (updated to include new fields)
ALTER TABLE "ConciergeAttribute" DROP CONSTRAINT IF EXISTS "chk_exactly_one_value";
ALTER TABLE "ConciergeAttribute" ADD CONSTRAINT "chk_exactly_one_value"
CHECK (
  (("stringValue" IS NOT NULL)::int +
   ("numberValue" IS NOT NULL)::int +
   ("booleanValue" IS NOT NULL)::int +
   ("dateValue" IS NOT NULL)::int +
   ("jsonValue" IS NOT NULL)::int +
   ("relationshipValue" IS NOT NULL)::int +
   ("selectValue" IS NOT NULL)::int +
   ("fileValue" IS NOT NULL)::int +
   ("moneyValue" IS NOT NULL)::int) = 1
);

-- Create indexes for new fields
CREATE INDEX "idx_ca_relationship" ON "ConciergeAttribute"("fieldKey", "relationshipValue") WHERE "relationshipValue" IS NOT NULL;
CREATE INDEX "idx_ca_select" ON "ConciergeAttribute"("fieldKey", "selectValue") WHERE "selectValue" IS NOT NULL;
CREATE INDEX "idx_ca_money" ON "ConciergeAttribute"("fieldKey", "moneyValue", "moneyCurrency") WHERE "moneyValue" IS NOT NULL;