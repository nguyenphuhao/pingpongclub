-- CreateEnum
CREATE TYPE "DrawType" AS ENUM ('DOUBLES_PAIRING', 'GROUP_ASSIGNMENT', 'KNOCKOUT_PAIRING');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('DRAFT', 'APPLIED', 'CANCELLED');

-- CreateTable
CREATE TABLE "draw_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "stage_id" UUID,
    "type" "DrawType" NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'DRAFT',
    "payload" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draw_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_pairings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "draw_session_id" UUID NOT NULL,
    "side_a_id" UUID NOT NULL,
    "side_b_id" UUID,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draw_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draw_group_assignments" (
    "draw_session_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "tournament_participant_id" UUID NOT NULL,
    "seed_in_group" INTEGER,

    CONSTRAINT "draw_group_assignments_pkey" PRIMARY KEY ("draw_session_id","group_id","tournament_participant_id")
);

-- CreateIndex
CREATE INDEX "draw_sessions_tournament_id_type_created_at_idx" ON "draw_sessions"("tournament_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "draw_pairings_draw_session_id_order_idx" ON "draw_pairings"("draw_session_id", "order");

-- AddForeignKey
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_sessions" ADD CONSTRAINT "draw_sessions_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_pairings" ADD CONSTRAINT "draw_pairings_draw_session_id_fkey" FOREIGN KEY ("draw_session_id") REFERENCES "draw_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_group_assignments" ADD CONSTRAINT "draw_group_assignments_draw_session_id_fkey" FOREIGN KEY ("draw_session_id") REFERENCES "draw_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draw_group_assignments" ADD CONSTRAINT "draw_group_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
