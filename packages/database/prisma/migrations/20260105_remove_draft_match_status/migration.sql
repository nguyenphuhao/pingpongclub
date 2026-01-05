-- Remove DRAFT status from MatchStatus enum
-- Step 1: Update any existing DRAFT matches to SCHEDULED (if any) in all tables
UPDATE "tournament_matches" SET status = 'SCHEDULED' WHERE status = 'DRAFT';
UPDATE "matches" SET status = 'SCHEDULED' WHERE status = 'DRAFT';

-- Step 2: Create new enum without DRAFT
CREATE TYPE "MatchStatus_new" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Step 3: Drop defaults temporarily
ALTER TABLE "tournament_matches" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "matches" ALTER COLUMN status DROP DEFAULT;

-- Step 4: Alter columns to use new enum in all tables
ALTER TABLE "tournament_matches" ALTER COLUMN status TYPE "MatchStatus_new" USING (status::text::"MatchStatus_new");
ALTER TABLE "matches" ALTER COLUMN status TYPE "MatchStatus_new" USING (status::text::"MatchStatus_new");

-- Step 5: Drop old enum and rename new one
DROP TYPE "MatchStatus";
ALTER TYPE "MatchStatus_new" RENAME TO "MatchStatus";

-- Step 6: Restore defaults with new enum
ALTER TABLE "tournament_matches" ALTER COLUMN status SET DEFAULT 'SCHEDULED'::"MatchStatus";
ALTER TABLE "matches" ALTER COLUMN status SET DEFAULT 'SCHEDULED'::"MatchStatus";
