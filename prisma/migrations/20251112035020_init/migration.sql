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
    "igUsername" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "gender" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "profilePic" TEXT,
    "optedInMessenger" BOOLEAN NOT NULL DEFAULT false,
    "optedInInstagram" BOOLEAN NOT NULL DEFAULT false,
    "optedInWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "optedInTelegram" BOOLEAN NOT NULL DEFAULT false,
    "exportConsentGiven" BOOLEAN NOT NULL DEFAULT false,
    "exportConsentAt" TIMESTAMP(3),
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

-- CreateTable
CREATE TABLE "InteractionHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "storiesCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteractionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "igUsername" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsappPhone" TEXT,
    "timezone" TEXT,
    "profilePic" TEXT,
    "customFieldsData" TEXT,
    "tagsData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramVerification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "servicePrefix" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "suffix" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "externalWebsite" TEXT NOT NULL,
    "externalUserId" TEXT,
    "webhookUrl" TEXT,
    "callbackToken" TEXT,
    "apiKeyUsed" TEXT,
    "userId" TEXT,
    "igUsername" TEXT,
    "instagramId" TEXT,
    "manychatUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dmReceivedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationApiKey" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "websiteDomain" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "maxRequestsPerHour" INTEGER NOT NULL DEFAULT 100,
    "maxRequestsPerDay" INTEGER NOT NULL DEFAULT 1000,
    "servicePrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlowkickClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "monthlyRequestsLimit" INTEGER NOT NULL DEFAULT 1000,
    "monthlyRequestsUsed" INTEGER NOT NULL DEFAULT 0,
    "requestsResetAt" TIMESTAMP(3),
    "instagramHandle" TEXT,
    "tiktokHandle" TEXT,
    "googlePlaceId" TEXT,
    "twitterHandle" TEXT,
    "youtubeChannelId" TEXT,
    "facebookPageId" TEXT,
    "apifyUserId" TEXT,
    "apifyApiToken" TEXT,
    "useSharedApify" BOOLEAN NOT NULL DEFAULT true,
    "cacheRefreshInterval" INTEGER NOT NULL DEFAULT 30,
    "webhookUrl" TEXT,
    "allowedOrigins" TEXT,
    "lastRequestAt" TIMESTAMP(3),
    "totalRequestsAllTime" INTEGER NOT NULL DEFAULT 0,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlowkickClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaCache" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isFresh" BOOLEAN NOT NULL DEFAULT true,
    "apifyDatasetId" TEXT,
    "apifyRunId" TEXT,
    "fetchDurationMs" INTEGER,
    "transformDurationMs" INTEGER,
    "dataSourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApifyDataSource" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "config" TEXT NOT NULL,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleCron" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunId" TEXT,
    "lastRunStatus" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "lastDatasetId" TEXT,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "avgRunDurationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApifyDataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "platform" TEXT,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "statusCode" INTEGER NOT NULL,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "responseSizeBytes" INTEGER,
    "responseDurationMs" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "origin" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 60,
    "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
    "lastDeliveryAt" TIMESTAMP(3),
    "lastDeliveryStatus" TEXT,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "payloadSizeBytes" INTEGER,
    "status" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "nextRetryAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExport" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "fields" TEXT NOT NULL,
    "filters" TEXT,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "fileHash" TEXT,
    "fileSizeBytes" INTEGER,
    "destinationUrl" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "includesWithoutConsent" BOOLEAN NOT NULL DEFAULT false,
    "initiatedBy" TEXT NOT NULL,
    "ipAddress" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "DataExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCategory" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "postUrl" TEXT NOT NULL,
    "caption" TEXT,
    "type" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "carouselImages" TEXT,
    "hashtags" TEXT,
    "mentions" TEXT,
    "locationName" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "websiteEnabled" BOOLEAN NOT NULL DEFAULT false,
    "customTitle" TEXT,
    "customDescription" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCategoryAssignment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "PostCategoryAssignment_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "InteractionHistory_userId_idx" ON "InteractionHistory"("userId");

-- CreateIndex
CREATE INDEX "InteractionHistory_date_idx" ON "InteractionHistory"("date");

-- CreateIndex
CREATE INDEX "InteractionHistory_createdAt_idx" ON "InteractionHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InteractionHistory_userId_date_key" ON "InteractionHistory"("userId", "date");

-- CreateIndex
CREATE INDEX "UserSnapshot_userId_idx" ON "UserSnapshot"("userId");

-- CreateIndex
CREATE INDEX "UserSnapshot_createdAt_idx" ON "UserSnapshot"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramVerification_code_key" ON "InstagramVerification"("code");

-- CreateIndex
CREATE INDEX "InstagramVerification_code_idx" ON "InstagramVerification"("code");

-- CreateIndex
CREATE INDEX "InstagramVerification_status_idx" ON "InstagramVerification"("status");

-- CreateIndex
CREATE INDEX "InstagramVerification_expiresAt_idx" ON "InstagramVerification"("expiresAt");

-- CreateIndex
CREATE INDEX "InstagramVerification_adminId_idx" ON "InstagramVerification"("adminId");

-- CreateIndex
CREATE INDEX "InstagramVerification_externalWebsite_idx" ON "InstagramVerification"("externalWebsite");

-- CreateIndex
CREATE INDEX "InstagramVerification_servicePrefix_idx" ON "InstagramVerification"("servicePrefix");

-- CreateIndex
CREATE INDEX "InstagramVerification_createdAt_idx" ON "InstagramVerification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationApiKey_apiKey_key" ON "VerificationApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "VerificationApiKey_adminId_idx" ON "VerificationApiKey"("adminId");

-- CreateIndex
CREATE INDEX "VerificationApiKey_apiKey_idx" ON "VerificationApiKey"("apiKey");

-- CreateIndex
CREATE INDEX "VerificationApiKey_active_idx" ON "VerificationApiKey"("active");

-- CreateIndex
CREATE UNIQUE INDEX "FlowkickClient_email_key" ON "FlowkickClient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FlowkickClient_apiKey_key" ON "FlowkickClient"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "FlowkickClient_stripeCustomerId_key" ON "FlowkickClient"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "FlowkickClient_apiKey_idx" ON "FlowkickClient"("apiKey");

-- CreateIndex
CREATE INDEX "FlowkickClient_email_idx" ON "FlowkickClient"("email");

-- CreateIndex
CREATE INDEX "FlowkickClient_active_idx" ON "FlowkickClient"("active");

-- CreateIndex
CREATE INDEX "FlowkickClient_plan_idx" ON "FlowkickClient"("plan");

-- CreateIndex
CREATE INDEX "SocialMediaCache_clientId_idx" ON "SocialMediaCache"("clientId");

-- CreateIndex
CREATE INDEX "SocialMediaCache_platform_idx" ON "SocialMediaCache"("platform");

-- CreateIndex
CREATE INDEX "SocialMediaCache_expiresAt_idx" ON "SocialMediaCache"("expiresAt");

-- CreateIndex
CREATE INDEX "SocialMediaCache_isFresh_idx" ON "SocialMediaCache"("isFresh");

-- CreateIndex
CREATE INDEX "SocialMediaCache_fetchedAt_idx" ON "SocialMediaCache"("fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaCache_clientId_platform_dataType_key" ON "SocialMediaCache"("clientId", "platform", "dataType");

-- CreateIndex
CREATE INDEX "ApifyDataSource_clientId_idx" ON "ApifyDataSource"("clientId");

-- CreateIndex
CREATE INDEX "ApifyDataSource_platform_idx" ON "ApifyDataSource"("platform");

-- CreateIndex
CREATE INDEX "ApifyDataSource_active_idx" ON "ApifyDataSource"("active");

-- CreateIndex
CREATE INDEX "ApifyDataSource_lastRunAt_idx" ON "ApifyDataSource"("lastRunAt");

-- CreateIndex
CREATE INDEX "ApiUsage_clientId_idx" ON "ApiUsage"("clientId");

-- CreateIndex
CREATE INDEX "ApiUsage_createdAt_idx" ON "ApiUsage"("createdAt");

-- CreateIndex
CREATE INDEX "ApiUsage_endpoint_idx" ON "ApiUsage"("endpoint");

-- CreateIndex
CREATE INDEX "ApiUsage_platform_idx" ON "ApiUsage"("platform");

-- CreateIndex
CREATE INDEX "ApiUsage_cacheHit_idx" ON "ApiUsage"("cacheHit");

-- CreateIndex
CREATE INDEX "WebhookSubscription_adminId_idx" ON "WebhookSubscription"("adminId");

-- CreateIndex
CREATE INDEX "WebhookSubscription_active_idx" ON "WebhookSubscription"("active");

-- CreateIndex
CREATE INDEX "WebhookSubscription_lastDeliveryAt_idx" ON "WebhookSubscription"("lastDeliveryAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_subscriptionId_idx" ON "WebhookDelivery"("subscriptionId");

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_idx" ON "WebhookDelivery"("status");

-- CreateIndex
CREATE INDEX "WebhookDelivery_sentAt_idx" ON "WebhookDelivery"("sentAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_event_idx" ON "WebhookDelivery"("event");

-- CreateIndex
CREATE INDEX "WebhookDelivery_nextRetryAt_idx" ON "WebhookDelivery"("nextRetryAt");

-- CreateIndex
CREATE INDEX "DataExport_adminId_idx" ON "DataExport"("adminId");

-- CreateIndex
CREATE INDEX "DataExport_createdAt_idx" ON "DataExport"("createdAt");

-- CreateIndex
CREATE INDEX "DataExport_exportType_idx" ON "DataExport"("exportType");

-- CreateIndex
CREATE INDEX "DataExport_recordType_idx" ON "DataExport"("recordType");

-- CreateIndex
CREATE INDEX "DataExport_expiresAt_idx" ON "DataExport"("expiresAt");

-- CreateIndex
CREATE INDEX "PostCategory_adminId_idx" ON "PostCategory"("adminId");

-- CreateIndex
CREATE INDEX "PostCategory_active_idx" ON "PostCategory"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategory_adminId_name_key" ON "PostCategory"("adminId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_shortCode_key" ON "InstagramPost"("shortCode");

-- CreateIndex
CREATE INDEX "InstagramPost_adminId_idx" ON "InstagramPost"("adminId");

-- CreateIndex
CREATE INDEX "InstagramPost_shortCode_idx" ON "InstagramPost"("shortCode");

-- CreateIndex
CREATE INDEX "InstagramPost_websiteEnabled_idx" ON "InstagramPost"("websiteEnabled");

-- CreateIndex
CREATE INDEX "InstagramPost_timestamp_idx" ON "InstagramPost"("timestamp");

-- CreateIndex
CREATE INDEX "InstagramPost_displayOrder_idx" ON "InstagramPost"("displayOrder");

-- CreateIndex
CREATE INDEX "PostCategoryAssignment_postId_idx" ON "PostCategoryAssignment"("postId");

-- CreateIndex
CREATE INDEX "PostCategoryAssignment_categoryId_idx" ON "PostCategoryAssignment"("categoryId");

-- CreateIndex
CREATE INDEX "PostCategoryAssignment_assignedAt_idx" ON "PostCategoryAssignment"("assignedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostCategoryAssignment_postId_categoryId_key" ON "PostCategoryAssignment"("postId", "categoryId");

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

-- AddForeignKey
ALTER TABLE "InteractionHistory" ADD CONSTRAINT "InteractionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSnapshot" ADD CONSTRAINT "UserSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramVerification" ADD CONSTRAINT "InstagramVerification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstagramVerification" ADD CONSTRAINT "InstagramVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationApiKey" ADD CONSTRAINT "VerificationApiKey_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaCache" ADD CONSTRAINT "SocialMediaCache_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "FlowkickClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaCache" ADD CONSTRAINT "SocialMediaCache_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "ApifyDataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApifyDataSource" ADD CONSTRAINT "ApifyDataSource_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "FlowkickClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiUsage" ADD CONSTRAINT "ApiUsage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "FlowkickClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExport" ADD CONSTRAINT "DataExport_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategoryAssignment" ADD CONSTRAINT "PostCategoryAssignment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCategoryAssignment" ADD CONSTRAINT "PostCategoryAssignment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PostCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
