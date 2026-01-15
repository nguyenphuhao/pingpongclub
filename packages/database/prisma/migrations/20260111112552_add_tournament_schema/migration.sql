-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "stage_type" AS ENUM ('group', 'knockout');

-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "match_side_label" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "h2h_mode" AS ENUM ('two_way_only', 'mini_table');

-- CreateEnum
CREATE TYPE "bracket_source_type" AS ENUM ('match_winner', 'group_rank', 'seed');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "seed" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "stage_type" NOT NULL,
    "stage_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stage_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "group_order" INTEGER,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "group_id" UUID NOT NULL,
    "tournament_participant_id" UUID NOT NULL,
    "seed_in_group" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id","tournament_participant_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stage_id" UUID NOT NULL,
    "group_id" UUID,
    "round_no" INTEGER,
    "match_no" INTEGER,
    "best_of" INTEGER NOT NULL,
    "status" "match_status" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_sides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "side" "match_side_label" NOT NULL,
    "is_winner" BOOLEAN,
    "walkover_reason" TEXT,

    CONSTRAINT "match_sides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_side_members" (
    "match_side_id" UUID NOT NULL,
    "tournament_participant_id" UUID NOT NULL,

    CONSTRAINT "match_side_members_pkey" PRIMARY KEY ("match_side_id","tournament_participant_id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "match_id" UUID NOT NULL,
    "game_no" INTEGER NOT NULL,
    "score_a" INTEGER NOT NULL,
    "score_b" INTEGER NOT NULL,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stage_id" UUID NOT NULL,
    "win_points" INTEGER NOT NULL DEFAULT 1,
    "loss_points" INTEGER NOT NULL DEFAULT 0,
    "bye_points" INTEGER NOT NULL DEFAULT 1,
    "count_bye_games_points" BOOLEAN NOT NULL DEFAULT false,
    "count_walkover_as_played" BOOLEAN NOT NULL DEFAULT true,
    "tie_break_order" JSONB NOT NULL,
    "h2h_mode" "h2h_mode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_standings" (
    "group_id" UUID NOT NULL,
    "tournament_participant_id" UUID NOT NULL,
    "rank" INTEGER,
    "match_points" INTEGER,
    "matches_won" INTEGER,
    "matches_lost" INTEGER,
    "games_won" INTEGER,
    "games_lost" INTEGER,
    "points_won" INTEGER,
    "points_lost" INTEGER,
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_standings_pkey" PRIMARY KEY ("group_id","tournament_participant_id")
);

-- CreateTable
CREATE TABLE "bracket_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "target_match_id" UUID NOT NULL,
    "target_side" "match_side_label" NOT NULL,
    "source_type" "bracket_source_type" NOT NULL,
    "source_match_id" UUID,
    "source_group_id" UUID,
    "source_rank" INTEGER,
    "source_seed" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bracket_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournament_id_display_name_key" ON "tournament_participants"("tournament_id", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "groups_stage_id_name_key" ON "groups"("stage_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "match_sides_match_id_side_key" ON "match_sides"("match_id", "side");

-- CreateIndex
CREATE UNIQUE INDEX "games_match_id_game_no_key" ON "games"("match_id", "game_no");

-- CreateIndex
CREATE UNIQUE INDEX "stage_rules_stage_id_key" ON "stage_rules"("stage_id");

-- CreateIndex
CREATE UNIQUE INDEX "bracket_slots_target_match_id_target_side_key" ON "bracket_slots"("target_match_id", "target_side");

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_tournament_participant_id_fkey" FOREIGN KEY ("tournament_participant_id") REFERENCES "tournament_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_sides" ADD CONSTRAINT "match_sides_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side_members" ADD CONSTRAINT "match_side_members_match_side_id_fkey" FOREIGN KEY ("match_side_id") REFERENCES "match_sides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_side_members" ADD CONSTRAINT "match_side_members_tournament_participant_id_fkey" FOREIGN KEY ("tournament_participant_id") REFERENCES "tournament_participants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_rules" ADD CONSTRAINT "stage_rules_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_standings" ADD CONSTRAINT "group_standings_tournament_participant_id_fkey" FOREIGN KEY ("tournament_participant_id") REFERENCES "tournament_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_target_match_id_fkey" FOREIGN KEY ("target_match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_source_match_id_fkey" FOREIGN KEY ("source_match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_source_group_id_fkey" FOREIGN KEY ("source_group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
