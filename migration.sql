warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "manychatId" TEXT NOT NULL,
    "instagramId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "gender" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "optedInMessenger" BOOLEAN NOT NULL DEFAULT false,
    "optedInInstagram" BOOLEAN NOT NULL DEFAULT false,
    "optedInWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "optedInTelegram" BOOLEAN NOT NULL DEFAULT false,
    "subscribedAt" TIMESTAMP(3),
    "lastTextInput" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT,
    "manychatFlowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scannedAt" TIMESTAMP(3),
    "scannedBy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "title" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokens" INTEGER,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManychatConfig" (
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

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "manychatTagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactTag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
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

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
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
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_manychatId_key" ON "User"("manychatId");

-- CreateIndex
CREATE UNIQUE INDEX "User_instagramId_key" ON "User"("instagramId");

-- CreateIndex
CREATE INDEX "Tool_adminId_idx" ON "Tool"("adminId");

-- CreateIndex
CREATE INDEX "Availability_toolId_idx" ON "Availability"("toolId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_toolId_idx" ON "Booking"("toolId");

-- CreateIndex
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_code_key" ON "QRCode"("code");

-- CreateIndex
CREATE INDEX "QRCode_userId_idx" ON "QRCode"("userId");

-- CreateIndex
CREATE INDEX "QRCode_toolId_idx" ON "QRCode"("toolId");

-- CreateIndex
CREATE INDEX "QRCode_code_idx" ON "QRCode"("code");

-- CreateIndex
CREATE INDEX "Conversation_userId_idx" ON "Conversation"("userId");

-- CreateIndex
CREATE INDEX "Conversation_toolId_idx" ON "Conversation"("toolId");

-- CreateIndex
CREATE INDEX "Conversation_active_idx" ON "Conversation"("active");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE INDEX "AIMessage_createdAt_idx" ON "AIMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ManychatConfig_adminId_key" ON "ManychatConfig"("adminId");

-- CreateIndex
CREATE INDEX "ManychatConfig_adminId_idx" ON "ManychatConfig"("adminId");

-- CreateIndex
CREATE INDEX "Tag_adminId_idx" ON "Tag"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_adminId_manychatTagId_key" ON "Tag"("adminId", "manychatTagId");

-- CreateIndex
CREATE INDEX "ContactTag_userId_idx" ON "ContactTag"("userId");

-- CreateIndex
CREATE INDEX "ContactTag_tagId_idx" ON "ContactTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactTag_userId_tagId_key" ON "ContactTag"("userId", "tagId");

-- CreateIndex
CREATE INDEX "CustomField_adminId_idx" ON "CustomField"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_adminId_manychatFieldId_key" ON "CustomField"("adminId", "manychatFieldId");

-- CreateIndex
CREATE INDEX "CustomFieldValue_userId_idx" ON "CustomFieldValue"("userId");

-- CreateIndex
CREATE INDEX "CustomFieldValue_fieldId_idx" ON "CustomFieldValue"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_userId_fieldId_key" ON "CustomFieldValue"("userId", "fieldId");

-- CreateIndex
CREATE INDEX "SyncLog_configId_idx" ON "SyncLog"("configId");

-- CreateIndex
CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");

-- CreateIndex
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManychatConfig" ADD CONSTRAINT "ManychatConfig_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactTag" ADD CONSTRAINT "ContactTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ManychatConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
