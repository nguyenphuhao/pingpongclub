-- Seed users + tournament use cases
-- 1) Giai don 1 stage voi 20 nguoi tham gia
-- 2) Giai don 2 stages voi 20 nguoi tham gia
-- 3) Giai doi 2 stages voi 40 nguoi tham gia (ghep doi ngau nhien)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users (40)
INSERT INTO "users" (
  "id",
  "email",
  "first_name",
  "last_name",
  "display_name",
  "nickname",
  "role",
  "status",
  "email_verified",
  "phone_verified",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  'user' || gs || '@pingclub.local',
  'User',
  lpad(gs::text, 2, '0'),
  'User ' || lpad(gs::text, 2, '0'),
  'U' || lpad(gs::text, 2, '0'),
  'USER',
  'ACTIVE',
  true,
  false,
  now(),
  now()
FROM generate_series(1, 40) AS gs;

-- =====================================================
-- Use case 1: Giai don 1 stage voi 20 nguoi tham gia
-- =====================================================

WITH t AS (
  INSERT INTO "tournaments" ("name", "description")
  VALUES ('Giai don 1 stage', 'Giai don 1 stage, 20 nguoi')
  RETURNING "id"
)
INSERT INTO "tournament_participants" ("tournament_id", "display_name", "seed")
SELECT
  t."id",
  u."display_name",
  row_number() OVER (ORDER BY u."display_name")
FROM (
  SELECT "display_name" FROM "users" ORDER BY "display_name" LIMIT 20
) u, t;

WITH stage AS (
  INSERT INTO "stages" ("tournament_id", "name", "type", "stage_order")
  SELECT "id", 'Vong bang', 'group', 1
  FROM "tournaments"
  WHERE "name" = 'Giai don 1 stage'
  RETURNING "id"
),
"groups" AS (
  INSERT INTO "groups" ("stage_id", "name", "group_order")
  SELECT stage."id", g."name", g."group_order"
  FROM stage
  CROSS JOIN (
    VALUES ('A', 1), ('B', 2), ('C', 3), ('D', 4)
  ) AS g("name", "group_order")
  RETURNING "id", "group_order"
),
participants AS (
  SELECT
    tp."id",
    row_number() OVER (ORDER BY tp."display_name") AS rn
  FROM "tournament_participants" tp
  JOIN "tournaments" t ON t."id" = tp."tournament_id"
  WHERE t."name" = 'Giai don 1 stage'
)
INSERT INTO "group_members" ("group_id", "tournament_participant_id", "seed_in_group")
SELECT
  g."id",
  p."id",
  p.rn
FROM participants p
JOIN "groups" g ON g."group_order" = ((p.rn - 1) / 5) + 1;

INSERT INTO "stage_rules" (
  "stage_id",
  "tie_break_order",
  "h2h_mode"
)
SELECT
  s."id",
  '["match_points","matches_won","head_to_head","games_diff","points_diff"]'::jsonb,
  'two_way_only'
FROM "stages" s
JOIN "tournaments" t ON t."id" = s."tournament_id"
WHERE t."name" = 'Giai don 1 stage' AND s."stage_order" = 1;

WITH group_members_ranked AS (
  SELECT
    g."id" AS group_id,
    g."stage_id" AS stage_id,
    gm."tournament_participant_id" AS participant_id,
    row_number() OVER (PARTITION BY g."id" ORDER BY tp."display_name") AS rn
  FROM "group_members" gm
  JOIN "groups" g ON g."id" = gm."group_id"
  JOIN "stages" s ON s."id" = g."stage_id"
  JOIN "tournaments" t ON t."id" = s."tournament_id"
  JOIN "tournament_participants" tp ON tp."id" = gm."tournament_participant_id"
  WHERE t."name" = 'Giai don 1 stage' AND s."stage_order" = 1
),
pairs AS (
  SELECT
    gm1.group_id,
    gm1.stage_id,
    gm1.participant_id AS participant_a,
    gm2.participant_id AS participant_b,
    row_number() OVER (PARTITION BY gm1.group_id ORDER BY gm1.rn, gm2.rn) AS match_no
  FROM group_members_ranked gm1
  JOIN group_members_ranked gm2
    ON gm1.group_id = gm2.group_id AND gm1.rn < gm2.rn
),
matches AS (
  INSERT INTO "matches" ("stage_id", "group_id", "round_no", "match_no", "best_of", "status")
  SELECT
    p."stage_id",
    p."group_id",
    1,
    p."match_no",
    5,
    'scheduled'::"match_status"
  FROM pairs p
  RETURNING "id", "group_id", "stage_id", "match_no"
),
sides AS (
  INSERT INTO "match_sides" ("match_id", "side", "is_winner")
  SELECT
    m."id",
    s.side::"match_side_label",
    CASE WHEN s.side = 'A' THEN true ELSE false END
  FROM matches m
  CROSS JOIN (VALUES ('A'), ('B')) AS s(side)
  RETURNING "id", "match_id", "side"
),
members AS (
  INSERT INTO "match_side_members" ("match_side_id", "tournament_participant_id")
  SELECT
    s."id",
    CASE WHEN s."side" = 'A'::"match_side_label" THEN p.participant_a ELSE p.participant_b END
  FROM sides s
  JOIN matches m ON m."id" = s."match_id"
  JOIN pairs p ON p.group_id = m.group_id AND p.match_no = m.match_no
),
games AS (
  INSERT INTO "games" ("match_id", "game_no", "score_a", "score_b")
  SELECT
    m."id",
    g.game_no,
    CASE WHEN g.game_no IN (1, 3) THEN 11 ELSE 9 END,
    CASE WHEN g.game_no IN (1, 3) THEN 7 ELSE 11 END
  FROM matches m
  CROSS JOIN (VALUES (1), (2), (3)) AS g(game_no)
)
INSERT INTO "group_standings" (
  "group_id",
  "tournament_participant_id",
  "rank",
  "match_points",
  "matches_won",
  "matches_lost",
  "games_won",
  "games_lost",
  "points_won",
  "points_lost",
  "note"
)
SELECT
  gm."group_id",
  gm."tournament_participant_id",
  NULL,
  COUNT(DISTINCT CASE WHEN ms."is_winner" THEN m."id" END),
  COUNT(DISTINCT CASE WHEN ms."is_winner" THEN m."id" END),
  COUNT(DISTINCT CASE WHEN ms."is_winner" = false THEN m."id" END),
  SUM(
    CASE
      WHEN ms."side" = 'A'::"match_side_label" AND g."score_a" > g."score_b" THEN 1
      WHEN ms."side" = 'B'::"match_side_label" AND g."score_b" > g."score_a" THEN 1
      ELSE 0
    END
  ),
  SUM(
    CASE
      WHEN ms."side" = 'A'::"match_side_label" AND g."score_a" < g."score_b" THEN 1
      WHEN ms."side" = 'B'::"match_side_label" AND g."score_b" < g."score_a" THEN 1
      ELSE 0
    END
  ),
  SUM(CASE WHEN ms."side" = 'A'::"match_side_label" THEN g."score_a" ELSE g."score_b" END),
  SUM(CASE WHEN ms."side" = 'A'::"match_side_label" THEN g."score_b" ELSE g."score_a" END),
  'seeded'
FROM "group_members" gm
JOIN "groups" gr ON gr."id" = gm."group_id"
JOIN "stages" s ON s."id" = gr."stage_id"
JOIN "tournaments" t ON t."id" = s."tournament_id"
LEFT JOIN "match_side_members" msm ON msm."tournament_participant_id" = gm."tournament_participant_id"
LEFT JOIN "match_sides" ms ON ms."id" = msm."match_side_id"
LEFT JOIN "matches" m ON m."id" = ms."match_id" AND m."group_id" = gm."group_id"
LEFT JOIN "games" g ON g."match_id" = m."id"
WHERE t."name" = 'Giai don 1 stage' AND s."stage_order" = 1
GROUP BY gm."group_id", gm."tournament_participant_id";

-- =====================================================
-- Use case 2: Giai don 2 stages voi 20 nguoi tham gia
-- =====================================================

WITH t AS (
  INSERT INTO "tournaments" ("name", "description")
  VALUES ('Giai don 2 stages', 'Giai don 2 stages, 20 nguoi')
  RETURNING "id"
)
INSERT INTO "tournament_participants" ("tournament_id", "display_name", "seed")
SELECT
  t."id",
  u."display_name",
  row_number() OVER (ORDER BY u."display_name")
FROM (
  SELECT "display_name" FROM "users" ORDER BY "display_name" LIMIT 20
) u, t;

WITH stage AS (
  INSERT INTO "stages" ("tournament_id", "name", "type", "stage_order")
  SELECT "id", 'Vong bang', 'group', 1
  FROM "tournaments"
  WHERE "name" = 'Giai don 2 stages'
  RETURNING "id"
),
"groups" AS (
  INSERT INTO "groups" ("stage_id", "name", "group_order")
  SELECT stage."id", g."name", g."group_order"
  FROM stage
  CROSS JOIN (
    VALUES ('A', 1), ('B', 2), ('C', 3), ('D', 4)
  ) AS g("name", "group_order")
  RETURNING "id", "group_order"
),
participants AS (
  SELECT
    tp."id",
    row_number() OVER (ORDER BY tp."display_name") AS rn
  FROM "tournament_participants" tp
  JOIN "tournaments" t ON t."id" = tp."tournament_id"
  WHERE t."name" = 'Giai don 2 stages'
)
INSERT INTO "group_members" ("group_id", "tournament_participant_id", "seed_in_group")
SELECT
  g."id",
  p."id",
  p.rn
FROM participants p
JOIN "groups" g ON g."group_order" = ((p.rn - 1) / 5) + 1;

INSERT INTO "stage_rules" (
  "stage_id",
  "tie_break_order",
  "h2h_mode"
)
SELECT
  s."id",
  '["match_points","matches_won","head_to_head","games_diff","points_diff"]'::jsonb,
  'two_way_only'
FROM "stages" s
JOIN "tournaments" t ON t."id" = s."tournament_id"
WHERE t."name" = 'Giai don 2 stages' AND s."stage_order" = 1;

WITH group_members_ranked AS (
  SELECT
    g."id" AS group_id,
    g."stage_id" AS stage_id,
    gm."tournament_participant_id" AS participant_id,
    row_number() OVER (PARTITION BY g."id" ORDER BY tp."display_name") AS rn
  FROM "group_members" gm
  JOIN "groups" g ON g."id" = gm."group_id"
  JOIN "stages" s ON s."id" = g."stage_id"
  JOIN "tournaments" t ON t."id" = s."tournament_id"
  JOIN "tournament_participants" tp ON tp."id" = gm."tournament_participant_id"
  WHERE t."name" = 'Giai don 2 stages' AND s."stage_order" = 1
),
pairs AS (
  SELECT
    gm1.group_id,
    gm1.stage_id,
    gm1.participant_id AS participant_a,
    gm2.participant_id AS participant_b,
    row_number() OVER (PARTITION BY gm1.group_id ORDER BY gm1.rn, gm2.rn) AS match_no
  FROM group_members_ranked gm1
  JOIN group_members_ranked gm2
    ON gm1.group_id = gm2.group_id AND gm1.rn < gm2.rn
),
matches AS (
  INSERT INTO "matches" ("stage_id", "group_id", "round_no", "match_no", "best_of", "status")
  SELECT
    p."stage_id",
    p."group_id",
    1,
    p."match_no",
    5,
    'scheduled'::"match_status"
  FROM pairs p
  RETURNING "id", "group_id", "stage_id", "match_no"
),
sides AS (
  INSERT INTO "match_sides" ("match_id", "side", "is_winner")
  SELECT
    m."id",
    s.side::"match_side_label",
    CASE WHEN s.side = 'A' THEN true ELSE false END
  FROM matches m
  CROSS JOIN (VALUES ('A'), ('B')) AS s(side)
  RETURNING "id", "match_id", "side"
),
members AS (
  INSERT INTO "match_side_members" ("match_side_id", "tournament_participant_id")
  SELECT
    s."id",
    CASE WHEN s."side" = 'A'::"match_side_label" THEN p.participant_a ELSE p.participant_b END
  FROM sides s
  JOIN matches m ON m."id" = s."match_id"
  JOIN pairs p ON p.group_id = m.group_id AND p.match_no = m.match_no
),
games AS (
  INSERT INTO "games" ("match_id", "game_no", "score_a", "score_b")
  SELECT
    m."id",
    g.game_no,
    CASE WHEN g.game_no IN (1, 3) THEN 11 ELSE 9 END,
    CASE WHEN g.game_no IN (1, 3) THEN 7 ELSE 11 END
  FROM matches m
  CROSS JOIN (VALUES (1), (2), (3)) AS g(game_no)
)
INSERT INTO "group_standings" (
  "group_id",
  "tournament_participant_id",
  "rank",
  "match_points",
  "matches_won",
  "matches_lost",
  "games_won",
  "games_lost",
  "points_won",
  "points_lost",
  "note"
)
SELECT
  gm."group_id",
  gm."tournament_participant_id",
  NULL,
  COUNT(DISTINCT CASE WHEN ms."is_winner" THEN m."id" END),
  COUNT(DISTINCT CASE WHEN ms."is_winner" THEN m."id" END),
  COUNT(DISTINCT CASE WHEN ms."is_winner" = false THEN m."id" END),
  SUM(
    CASE
      WHEN ms."side" = 'A'::"match_side_label" AND g."score_a" > g."score_b" THEN 1
      WHEN ms."side" = 'B'::"match_side_label" AND g."score_b" > g."score_a" THEN 1
      ELSE 0
    END
  ),
  SUM(
    CASE
      WHEN ms."side" = 'A'::"match_side_label" AND g."score_a" < g."score_b" THEN 1
      WHEN ms."side" = 'B'::"match_side_label" AND g."score_b" < g."score_a" THEN 1
      ELSE 0
    END
  ),
  SUM(CASE WHEN ms."side" = 'A'::"match_side_label" THEN g."score_a" ELSE g."score_b" END),
  SUM(CASE WHEN ms."side" = 'A'::"match_side_label" THEN g."score_b" ELSE g."score_a" END),
  'seeded'
FROM "group_members" gm
JOIN "groups" gr ON gr."id" = gm."group_id"
JOIN "stages" s ON s."id" = gr."stage_id"
JOIN "tournaments" t ON t."id" = s."tournament_id"
LEFT JOIN "match_side_members" msm ON msm."tournament_participant_id" = gm."tournament_participant_id"
LEFT JOIN "match_sides" ms ON ms."id" = msm."match_side_id"
LEFT JOIN "matches" m ON m."id" = ms."match_id" AND m."group_id" = gm."group_id"
LEFT JOIN "games" g ON g."match_id" = m."id"
WHERE t."name" = 'Giai don 2 stages' AND s."stage_order" = 1
GROUP BY gm."group_id", gm."tournament_participant_id";

WITH knockout_stage AS (
  INSERT INTO "stages" ("tournament_id", "name", "type", "stage_order")
  SELECT "id", 'Vong loai truc tiep', 'knockout', 2
  FROM "tournaments"
  WHERE "name" = 'Giai don 2 stages'
  RETURNING "id"
),
match_rows AS (
  INSERT INTO "matches" ("stage_id", "round_no", "match_no", "best_of", "status")
  SELECT "id", 1, gs, 5, 'scheduled'
  FROM knockout_stage, generate_series(1, 4) AS gs
  RETURNING "id", "match_no"
)
INSERT INTO "match_sides" ("match_id", "side")
SELECT m."id", s.side::"match_side_label"
FROM match_rows m
CROSS JOIN (VALUES ('A'), ('B')) AS s(side);

WITH knockout_stage AS (
  SELECT s."id"
  FROM "stages" s
  JOIN "tournaments" t ON t."id" = s."tournament_id"
  WHERE t."name" = 'Giai don 2 stages' AND s."stage_order" = 2
),
match_rows AS (
  SELECT m."id", m."match_no"
  FROM "matches" m
  JOIN knockout_stage ks ON ks."id" = m."stage_id"
),
"groups" AS (
  SELECT g."id", g."group_order"
  FROM "groups" g
  JOIN "stages" s ON s."id" = g."stage_id"
  JOIN "tournaments" t ON t."id" = s."tournament_id"
  WHERE t."name" = 'Giai don 2 stages' AND s."stage_order" = 1
),
slot_map AS (
  SELECT * FROM (
    VALUES
      (1, 'A', 1, 1),
      (1, 'B', 2, 2),
      (2, 'A', 2, 1),
      (2, 'B', 1, 2),
      (3, 'A', 3, 1),
      (3, 'B', 4, 2),
      (4, 'A', 4, 1),
      (4, 'B', 3, 2)
  ) AS v("match_no", "target_side", "group_order", "source_rank")
)
INSERT INTO "bracket_slots" (
  "target_match_id",
  "target_side",
  "source_type",
  "source_group_id",
  "source_rank"
)
SELECT
  m."id",
  v."target_side"::"match_side_label",
  'group_rank'::"bracket_source_type",
  g."id",
  v."source_rank"
FROM slot_map v
JOIN match_rows m ON m."match_no" = v."match_no"
JOIN "groups" g ON g."group_order" = v."group_order";

-- =====================================================
-- Use case 3: Giai doi 2 stages voi 40 nguoi tham gia
-- =====================================================

WITH t AS (
  INSERT INTO "tournaments" ("name", "description")
  VALUES ('Giai doi 2 stages', 'Giai doi 2 stages, 40 nguoi')
  RETURNING "id"
)
INSERT INTO "tournament_participants" ("tournament_id", "display_name", "seed")
SELECT
  t."id",
  u."display_name",
  row_number() OVER (ORDER BY u."display_name")
FROM (
  SELECT "display_name" FROM "users" ORDER BY "display_name" LIMIT 40
) u, t;

WITH stage AS (
  INSERT INTO "stages" ("tournament_id", "name", "type", "stage_order")
  SELECT "id", 'Vong bang', 'group', 1
  FROM "tournaments"
  WHERE "name" = 'Giai doi 2 stages'
  RETURNING "id"
),
"groups" AS (
  INSERT INTO "groups" ("stage_id", "name", "group_order")
  SELECT stage."id", g."name", g."group_order"
  FROM stage
  CROSS JOIN (
    VALUES ('A', 1), ('B', 2), ('C', 3), ('D', 4), ('E', 5), ('F', 6), ('G', 7), ('H', 8)
  ) AS g("name", "group_order")
  RETURNING "id", "group_order"
),
participants AS (
  SELECT
    tp."id",
    row_number() OVER (ORDER BY tp."display_name") AS rn
  FROM "tournament_participants" tp
  JOIN "tournaments" t ON t."id" = tp."tournament_id"
  WHERE t."name" = 'Giai doi 2 stages'
)
INSERT INTO "group_members" ("group_id", "tournament_participant_id", "seed_in_group")
SELECT
  g."id",
  p."id",
  p.rn
FROM participants p
JOIN "groups" g ON g."group_order" = ((p.rn - 1) / 5) + 1;

INSERT INTO "stage_rules" (
  "stage_id",
  "tie_break_order",
  "h2h_mode"
)
SELECT
  s."id",
  '["match_points","matches_won","head_to_head","games_diff","points_diff"]'::jsonb,
  'two_way_only'
FROM "stages" s
JOIN "tournaments" t ON t."id" = s."tournament_id"
WHERE t."name" = 'Giai doi 2 stages' AND s."stage_order" = 1;

WITH group_members_ranked AS (
  SELECT
    g."id" AS group_id,
    g."stage_id" AS stage_id,
    gm."tournament_participant_id" AS participant_id,
    row_number() OVER (PARTITION BY g."id" ORDER BY tp."display_name") AS rn
  FROM "group_members" gm
  JOIN "groups" g ON g."id" = gm."group_id"
  JOIN "stages" s ON s."id" = g."stage_id"
  JOIN "tournaments" t ON t."id" = s."tournament_id"
  JOIN "tournament_participants" tp ON tp."id" = gm."tournament_participant_id"
  WHERE t."name" = 'Giai doi 2 stages' AND s."stage_order" = 1
),
pairs AS (
  SELECT
    gm1.group_id,
    gm1.stage_id,
    gm1.participant_id AS participant_a,
    gm2.participant_id AS participant_b,
    row_number() OVER (PARTITION BY gm1.group_id ORDER BY gm1.rn, gm2.rn) AS match_no
  FROM group_members_ranked gm1
  JOIN group_members_ranked gm2
    ON gm1.group_id = gm2.group_id AND gm1.rn < gm2.rn
),
matches AS (
  INSERT INTO "matches" ("stage_id", "group_id", "round_no", "match_no", "best_of", "status")
  SELECT
    p."stage_id",
    p."group_id",
    1,
    p."match_no",
    5,
    'scheduled'::"match_status"
  FROM pairs p
  RETURNING "id", "group_id", "stage_id", "match_no"
),
sides AS (
  INSERT INTO "match_sides" ("match_id", "side", "is_winner")
  SELECT
    m."id",
    s.side::"match_side_label",
    CASE WHEN s.side = 'A' THEN true ELSE false END
  FROM matches m
  CROSS JOIN (VALUES ('A'), ('B')) AS s(side)
  RETURNING "id", "match_id", "side"
),
members AS (
  INSERT INTO "match_side_members" ("match_side_id", "tournament_participant_id")
  SELECT
    s."id",
    CASE WHEN s."side" = 'A'::"match_side_label" THEN p.participant_a ELSE p.participant_b END
  FROM sides s
  JOIN matches m ON m."id" = s."match_id"
  JOIN pairs p ON p.group_id = m.group_id AND p.match_no = m.match_no
),
games AS (
  INSERT INTO "games" ("match_id", "game_no", "score_a", "score_b")
  SELECT
    m."id",
    g.game_no,
    CASE WHEN g.game_no IN (1, 3) THEN 11 ELSE 9 END,
    CASE WHEN g.game_no IN (1, 3) THEN 7 ELSE 11 END
  FROM matches m
  CROSS JOIN (VALUES (1), (2), (3)) AS g(game_no)
)
INSERT INTO "group_standings" (
  "group_id",
  "tournament_participant_id",
  "rank",
  "match_points",
  "matches_won",
  "matches_lost",
  "games_won",
  "games_lost",
  "points_won",
  "points_lost",
  "note"
)
SELECT
  gm."group_id",
  gm."tournament_participant_id",
  NULL,
  COUNT(DISTINCT CASE WHEN ms."is_winner" THEN m."id" END),
  COUNT(DISTINCT CASE WHEN ms."is_winner" THEN m."id" END),
  COUNT(DISTINCT CASE WHEN ms."is_winner" = false THEN m."id" END),
  SUM(
    CASE
      WHEN ms."side" = 'A'::"match_side_label" AND g."score_a" > g."score_b" THEN 1
      WHEN ms."side" = 'B'::"match_side_label" AND g."score_b" > g."score_a" THEN 1
      ELSE 0
    END
  ),
  SUM(
    CASE
      WHEN ms."side" = 'A'::"match_side_label" AND g."score_a" < g."score_b" THEN 1
      WHEN ms."side" = 'B'::"match_side_label" AND g."score_b" < g."score_a" THEN 1
      ELSE 0
    END
  ),
  SUM(CASE WHEN ms."side" = 'A'::"match_side_label" THEN g."score_a" ELSE g."score_b" END),
  SUM(CASE WHEN ms."side" = 'A'::"match_side_label" THEN g."score_b" ELSE g."score_a" END),
  'seeded'
FROM "group_members" gm
JOIN "groups" gr ON gr."id" = gm."group_id"
JOIN "stages" s ON s."id" = gr."stage_id"
JOIN "tournaments" t ON t."id" = s."tournament_id"
LEFT JOIN "match_side_members" msm ON msm."tournament_participant_id" = gm."tournament_participant_id"
LEFT JOIN "match_sides" ms ON ms."id" = msm."match_side_id"
LEFT JOIN "matches" m ON m."id" = ms."match_id" AND m."group_id" = gm."group_id"
LEFT JOIN "games" g ON g."match_id" = m."id"
WHERE t."name" = 'Giai doi 2 stages' AND s."stage_order" = 1
GROUP BY gm."group_id", gm."tournament_participant_id";

WITH knockout_stage AS (
  INSERT INTO "stages" ("tournament_id", "name", "type", "stage_order")
  SELECT "id", 'Vong loai truc tiep', 'knockout', 2
  FROM "tournaments"
  WHERE "name" = 'Giai doi 2 stages'
  RETURNING "id"
),
match_rows AS (
  INSERT INTO "matches" ("stage_id", "round_no", "match_no", "best_of", "status")
  SELECT "id", 1, gs, 5, 'scheduled'
  FROM knockout_stage, generate_series(1, 10) AS gs
  RETURNING "id", "match_no"
),
sides AS (
  INSERT INTO "match_sides" ("match_id", "side")
  SELECT m."id", s.side::"match_side_label"
  FROM match_rows m
  CROSS JOIN (VALUES ('A'), ('B')) AS s(side)
  RETURNING "id", "match_id", "side"
),
participants AS (
  SELECT
    tp."id",
    row_number() OVER (ORDER BY random()) AS rn
  FROM "tournament_participants" tp
  JOIN "tournaments" t ON t."id" = tp."tournament_id"
  WHERE t."name" = 'Giai doi 2 stages'
),
assignments AS (
  SELECT
    p."id" AS participant_id,
    s."id" AS match_side_id
  FROM participants p
  JOIN match_rows m ON m."match_no" = ((p.rn - 1) / 4) + 1
  JOIN sides s ON s."match_id" = m."id"
    AND (
      CASE
        WHEN ((p.rn - 1) % 4) + 1 IN (1, 2) THEN s."side" = 'A'::"match_side_label"
        ELSE s."side" = 'B'::"match_side_label"
      END
    )
)
INSERT INTO "match_side_members" ("match_side_id", "tournament_participant_id")
SELECT "match_side_id", "participant_id"
FROM assignments;
