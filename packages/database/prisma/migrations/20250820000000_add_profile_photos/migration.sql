-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('PROFILE', 'COVER', 'THUMBNAIL', 'GALLERY');

-- CreateTable
CREATE TABLE "ProfilePhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "photoType" "PhotoType" NOT NULL DEFAULT 'PROFILE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfilePhoto_userId_idx" ON "ProfilePhoto"("userId");

-- CreateIndex
CREATE INDEX "ProfilePhoto_photoType_idx" ON "ProfilePhoto"("photoType");

-- CreateIndex
CREATE INDEX "ProfilePhoto_isActive_idx" ON "ProfilePhoto"("isActive");

-- CreateIndex
CREATE INDEX "ProfilePhoto_isPrimary_idx" ON "ProfilePhoto"("isPrimary");

-- CreateIndex
CREATE INDEX "ProfilePhoto_deletedAt_idx" ON "ProfilePhoto"("deletedAt");

-- AddForeignKey
ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing profile photos to ProfilePhoto table
INSERT INTO "ProfilePhoto" ("id", "userId", "fileKey", "fileName", "mimeType", "size", "photoType", "isActive", "isPrimary", "uploadedAt", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id" as "userId",
    "profilePhoto" as "fileKey",
    'profile-photo.jpg' as "fileName",
    'image/jpeg' as "mimeType",
    0 as "size",
    'PROFILE'::"PhotoType" as "photoType",
    true as "isActive",
    true as "isPrimary",
    "updatedAt" as "uploadedAt",
    "createdAt",
    "updatedAt"
FROM "User" 
WHERE "profilePhoto" IS NOT NULL AND "profilePhoto" != '';

-- Note: We keep the profilePhoto column for backward compatibility during transition
-- It will be removed in a future migration once the multi-photo system is fully implemented