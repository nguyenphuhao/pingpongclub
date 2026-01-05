-- Change Tournament default status from DRAFT to PENDING
-- This migration only affects the default value for new tournaments
-- Existing tournaments will keep their current status

-- Step 1: Alter the default value for status column
ALTER TABLE "tournaments" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"TournamentStatus";
