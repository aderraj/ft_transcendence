-- AlterTable
ALTER TABLE "users" ADD COLUMN "currentSessionToken" TEXT,
ADD COLUMN "sessionExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_currentSessionToken_key" ON "users"("currentSessionToken");
