-- CreateTable
CREATE TABLE "UserSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserSnapshot_userId_idx" ON "UserSnapshot"("userId");

-- CreateIndex
CREATE INDEX "UserSnapshot_createdAt_idx" ON "UserSnapshot"("createdAt");
