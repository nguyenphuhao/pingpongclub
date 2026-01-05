-- CreateEnum
CREATE TYPE "TournamentGameType" AS ENUM ('SINGLE_STAGE', 'TWO_STAGES');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('REGISTERED', 'CHECKED_IN', 'WITHDRAWN', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TournamentStage" AS ENUM ('GROUP', 'FINAL');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "game" TEXT NOT NULL DEFAULT 'TABLE_TENNIS',
    "game_type" "TournamentGameType" NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "registration_start_time" TIMESTAMP(3),
    "is_tentative" BOOLEAN NOT NULL DEFAULT false,
    "single_stage_config" JSONB,
    "two_stages_config" JSONB,
    "participants_locked" BOOLEAN NOT NULL DEFAULT false,
    "challonge_id" TEXT,
    "challonge_url" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seed" INTEGER,
    "group_id" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'REGISTERED',
    "challonge_participant_id" TEXT,

    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_groups" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "participants_per_group" INTEGER NOT NULL DEFAULT 4,
    "participants_advancing" INTEGER NOT NULL DEFAULT 2,
    "status" "GroupStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "tournament_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "group_id" TEXT,
    "stage" "TournamentStage" NOT NULL,
    "round" INTEGER NOT NULL,
    "match_number" INTEGER NOT NULL,
    "bracket_position" INTEGER,
    "match_date" TIMESTAMP(3),
    "court_number" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "winner_id" TEXT,
    "final_score" TEXT,
    "game_scores" JSONB,
    "is_placement_match" BOOLEAN NOT NULL DEFAULT false,
    "placement_rank" INTEGER,
    "challonge_match_id" TEXT,
    "challonge_round" INTEGER,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_match_participants" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "is_winner" BOOLEAN,
    "score" TEXT,

    CONSTRAINT "tournament_match_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_challonge_id_key" ON "tournaments"("challonge_id");

-- CreateIndex
CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");

-- CreateIndex
CREATE INDEX "tournaments_game_type_idx" ON "tournaments"("game_type");

-- CreateIndex
CREATE INDEX "tournaments_challonge_id_idx" ON "tournaments"("challonge_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_challonge_participant_id_key" ON "tournament_participants"("challonge_participant_id");

-- CreateIndex
CREATE INDEX "tournament_participants_tournament_id_idx" ON "tournament_participants"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_participants_user_id_idx" ON "tournament_participants"("user_id");

-- CreateIndex
CREATE INDEX "tournament_participants_group_id_idx" ON "tournament_participants"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournament_id_user_id_key" ON "tournament_participants"("tournament_id", "user_id");

-- CreateIndex
CREATE INDEX "tournament_groups_tournament_id_idx" ON "tournament_groups"("tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_matches_challonge_match_id_key" ON "tournament_matches"("challonge_match_id");

-- CreateIndex
CREATE INDEX "tournament_matches_tournament_id_idx" ON "tournament_matches"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_matches_group_id_idx" ON "tournament_matches"("group_id");

-- CreateIndex
CREATE INDEX "tournament_matches_status_idx" ON "tournament_matches"("status");

-- CreateIndex
CREATE INDEX "tournament_matches_stage_idx" ON "tournament_matches"("stage");

-- CreateIndex
CREATE INDEX "tournament_matches_winner_id_idx" ON "tournament_matches"("winner_id");

-- CreateIndex
CREATE INDEX "tournament_match_participants_match_id_idx" ON "tournament_match_participants"("match_id");

-- CreateIndex
CREATE INDEX "tournament_match_participants_participant_id_idx" ON "tournament_match_participants"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_match_participants_match_id_participant_id_key" ON "tournament_match_participants"("match_id", "participant_id");

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_groups" ADD CONSTRAINT "tournament_groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_match_participants" ADD CONSTRAINT "tournament_match_participants_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tournament_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_match_participants" ADD CONSTRAINT "tournament_match_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "tournament_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
