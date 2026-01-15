-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'MEMBERS', 'PRIVATE');

-- CreateEnum
CREATE TYPE "PlayerRank" AS ENUM ('A_STAR', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'UNRANKED');

-- CreateEnum
CREATE TYPE "RatingChangeReason" AS ENUM ('MATCH_WIN', 'MATCH_LOSS', 'MATCH_DRAW', 'ADMIN_ADJUSTMENT', 'INITIAL_RATING', 'SEASON_RESET');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "current_streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "initial_rating" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "peak_rating" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "play_style" TEXT,
ADD COLUMN     "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "rating_points" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "show_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_phone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_rating" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "started_playing_at" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "total_draws" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_losses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_matches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_wins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "win_rate" DOUBLE PRECISION,
ADD COLUMN     "years_playing" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "rating_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "old_rating" INTEGER NOT NULL,
    "new_rating" INTEGER NOT NULL,
    "rating_change" INTEGER NOT NULL,
    "old_rank" "PlayerRank" NOT NULL,
    "new_rank" "PlayerRank" NOT NULL,
    "change_reason" "RatingChangeReason" NOT NULL,
    "notes" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rating_history_user_id_idx" ON "rating_history"("user_id");

-- CreateIndex
CREATE INDEX "rating_history_changed_at_idx" ON "rating_history"("changed_at");

-- CreateIndex
CREATE INDEX "users_rating_points_idx" ON "users"("rating_points");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_nickname_idx" ON "users"("nickname");

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
