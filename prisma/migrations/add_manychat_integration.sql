-- Migration: Add Manychat Integration Tables
-- Add new fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsappPhone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "optedInMessenger" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "optedInInstagram" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "optedInWhatsapp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "optedInTelegram" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscribedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastTextInput" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3);

-- CreateTable ManychatConfig
CREATE TABLE IF NOT EXISTS "ManychatConfig" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "pageId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManychatConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable Tag
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "manychatTagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable ContactTag
CREATE TABLE IF NOT EXISTS "ContactTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable CustomField
CREATE TABLE IF NOT EXISTS "CustomField" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "manychatFieldId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable CustomFieldValue
CREATE TABLE IF NOT EXISTS "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable SyncLog
CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "metadata" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ManychatConfig_adminId_key" ON "ManychatConfig"("adminId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ManychatConfig_adminId_idx" ON "ManychatConfig"("adminId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Tag_adminId_idx" ON "Tag"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_adminId_manychatTagId_key" ON "Tag"("adminId", "manychatTagId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactTag_userId_idx" ON "ContactTag"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactTag_tagId_idx" ON "ContactTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ContactTag_userId_tagId_key" ON "ContactTag"("userId", "tagId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomField_adminId_idx" ON "CustomField"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomField_adminId_manychatFieldId_key" ON "CustomField"("adminId", "manychatFieldId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomFieldValue_userId_idx" ON "CustomFieldValue"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomFieldValue_fieldId_idx" ON "CustomFieldValue"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomFieldValue_userId_fieldId_key" ON "CustomFieldValue"("userId", "fieldId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SyncLog_configId_idx" ON "SyncLog"("configId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SyncLog_status_idx" ON "SyncLog"("status");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ManychatConfig_adminId_fkey'
    ) THEN
        ALTER TABLE "ManychatConfig" ADD CONSTRAINT "ManychatConfig_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Tag_adminId_fkey'
    ) THEN
        ALTER TABLE "Tag" ADD CONSTRAINT "Tag_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ContactTag_userId_fkey'
    ) THEN
        ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ContactTag_tagId_fkey'
    ) THEN
        ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CustomField_adminId_fkey'
    ) THEN
        ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CustomFieldValue_userId_fkey'
    ) THEN
        ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CustomFieldValue_fieldId_fkey'
    ) THEN
        ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'SyncLog_configId_fkey'
    ) THEN
        ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ManychatConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
