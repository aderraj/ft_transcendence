-- CreateEnum
CREATE TYPE "GameInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "game_invitations" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL DEFAULT 'remote',
    "status" "GameInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_invitations_inviterId_status_idx" ON "game_invitations"("inviterId", "status");

-- CreateIndex
CREATE INDEX "game_invitations_inviteeId_status_idx" ON "game_invitations"("inviteeId", "status");

-- CreateIndex
CREATE INDEX "game_invitations_expiresAt_idx" ON "game_invitations"("expiresAt");

-- AddForeignKey
ALTER TABLE "game_invitations" ADD CONSTRAINT "game_invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_invitations" ADD CONSTRAINT "game_invitations_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
