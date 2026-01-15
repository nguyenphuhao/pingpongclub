-- Add user_id to tournament_participants
ALTER TABLE "tournament_participants" ADD COLUMN "user_id" TEXT;

-- Index for lookup
CREATE INDEX "tournament_participants_user_id_idx" ON "tournament_participants"("user_id");

-- Foreign key to users
ALTER TABLE "tournament_participants"
  ADD CONSTRAINT "tournament_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
