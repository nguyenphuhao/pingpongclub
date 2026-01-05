-- Add virtual participant support to TournamentParticipant
-- Step 1: Add new columns
ALTER TABLE "tournament_participants" ADD COLUMN IF NOT EXISTS "is_virtual" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tournament_participants" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
ALTER TABLE "tournament_participants" ADD COLUMN IF NOT EXISTS "advancing_source" TEXT;

-- Step 2: Make userId nullable (for virtual participants)
ALTER TABLE "tournament_participants" ALTER COLUMN "user_id" DROP NOT NULL;

-- Step 3: Update the unique constraint to allow multiple virtual participants
-- Drop existing unique constraint (both index and constraint)
DROP INDEX IF EXISTS "tournament_participants_tournament_id_user_id_key";
ALTER TABLE "tournament_participants" DROP CONSTRAINT IF EXISTS "tournament_participants_tournament_id_user_id_key";

-- Add new unique index that excludes virtual participants (where userId is null)
-- Virtual participants won't be constrained by this
CREATE UNIQUE INDEX "tournament_participants_tournament_id_user_id_key"
ON "tournament_participants"("tournament_id", "user_id")
WHERE "user_id" IS NOT NULL;

-- Step 4: Add index for virtual participants
CREATE INDEX IF NOT EXISTS "tournament_participants_is_virtual_idx" ON "tournament_participants"("is_virtual");
