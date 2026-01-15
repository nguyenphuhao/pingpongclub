-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('SINGLE', 'DOUBLES');

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "match_format" "MatchFormat" NOT NULL DEFAULT 'SINGLE';

-- CreateTable
CREATE TABLE "tournament_participant_members" (
    "tournament_participant_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_participant_members_pkey" PRIMARY KEY ("tournament_participant_id","user_id")
);

-- CreateIndex
CREATE INDEX "tournament_participant_members_user_id_idx" ON "tournament_participant_members"("user_id");

-- AddForeignKey
ALTER TABLE "tournament_participant_members" ADD CONSTRAINT "tournament_participant_members_tournament_participant_id_fkey" FOREIGN KEY ("tournament_participant_id") REFERENCES "tournament_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participant_members" ADD CONSTRAINT "tournament_participant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
