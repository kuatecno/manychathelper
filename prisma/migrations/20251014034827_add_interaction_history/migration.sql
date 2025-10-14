-- CreateTable
CREATE TABLE "InteractionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messagesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "storiesCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InteractionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InteractionHistory_userId_idx" ON "InteractionHistory"("userId");

-- CreateIndex
CREATE INDEX "InteractionHistory_date_idx" ON "InteractionHistory"("date");

-- CreateIndex
CREATE INDEX "InteractionHistory_createdAt_idx" ON "InteractionHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InteractionHistory_userId_date_key" ON "InteractionHistory"("userId", "date");
