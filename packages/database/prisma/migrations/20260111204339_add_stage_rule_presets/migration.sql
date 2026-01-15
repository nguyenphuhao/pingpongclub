-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "qualify_mode" AS ENUM ('top_n_per_group', 'top_n_overall', 'custom');

-- CreateTable
CREATE TABLE "stage_rule_presets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "win_points" INTEGER NOT NULL DEFAULT 1,
    "loss_points" INTEGER NOT NULL DEFAULT 0,
    "bye_points" INTEGER NOT NULL DEFAULT 1,
    "count_bye_games_points" BOOLEAN NOT NULL DEFAULT false,
    "count_walkover_as_played" BOOLEAN NOT NULL DEFAULT true,
    "tie_break_order" JSONB NOT NULL,
    "h2h_mode" "h2h_mode" NOT NULL,
    "qualify_mode" "qualify_mode" NOT NULL DEFAULT 'top_n_per_group',
    "top_n_per_group" INTEGER,
    "top_n_overall" INTEGER,
    "wildcard_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_rule_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stage_rule_presets_code_key" ON "stage_rule_presets"("code");

-- CreateIndex
CREATE INDEX "stage_rule_presets_is_active_created_at_idx" ON "stage_rule_presets"("is_active", "created_at");

-- Add constraints
ALTER TABLE "stage_rule_presets" ADD CONSTRAINT "stage_rule_presets_points_chk"
  CHECK (win_points >= 0 AND loss_points >= 0 AND bye_points >= 0);

ALTER TABLE "stage_rule_presets" ADD CONSTRAINT "stage_rule_presets_wildcard_chk"
  CHECK (wildcard_count >= 0);

ALTER TABLE "stage_rule_presets" ADD CONSTRAINT "stage_rule_presets_qualify_chk"
  CHECK (
    (qualify_mode = 'top_n_per_group'
      AND top_n_per_group IS NOT NULL AND top_n_per_group > 0
      AND top_n_overall IS NULL)
    OR
    (qualify_mode = 'top_n_overall'
      AND top_n_overall IS NOT NULL AND top_n_overall > 0
      AND top_n_per_group IS NULL)
    OR
    (qualify_mode = 'custom'
      AND top_n_per_group IS NULL AND top_n_overall IS NULL)
  );

-- Seed default preset
INSERT INTO "stage_rule_presets" (
  "code",
  "name",
  "description",
  "win_points",
  "loss_points",
  "bye_points",
  "count_bye_games_points",
  "count_walkover_as_played",
  "tie_break_order",
  "h2h_mode",
  "qualify_mode",
  "top_n_per_group",
  "wildcard_count"
) VALUES (
  'TT_GROUP_CLB_DEFAULT_TOP2',
  'Bong ban CLB (chuan) - Top 2/bang',
  'Thang 1 thua 0, BYE=1; H2H chi khi hoa 2 nguoi; lay top 2 moi bang',
  1,
  0,
  1,
  false,
  true,
  '["match_points","matches_won","head_to_head","games_diff","points_diff"]'::jsonb,
  'two_way_only',
  'top_n_per_group',
  2,
  0
);
