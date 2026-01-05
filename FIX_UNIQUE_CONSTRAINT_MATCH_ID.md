# Fix: Unique Constraint Failed on Match ID

## Problem

**Error**: `Invalid prisma.tournamentMatch.create() invocation: Unique constraint failed on the fields: (id)`

**Root Cause**: The bracket generation was using hardcoded match IDs like `match-1`, `match-2`, `match-3rd-place`, etc. This caused conflicts when:
1. Trying to generate matches after a failed previous attempt
2. Database still had old matches that weren't properly cleaned up
3. Multiple tournaments trying to use the same match IDs

## Solution

Changed from hardcoded IDs to **auto-generated UUIDs** by Prisma.

## Changes Made

### File: [bracket.service.ts:151-168](apps/api-server/src/server/modules/tournament/application/bracket.service.ts#L151-L168)

#### Before (❌ Hardcoded IDs):
```typescript
let matchIdCounter = 1;

for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
  const matchId = `match-${matchIdCounter++}`;

  const match = await tx.tournamentMatch.create({
    data: {
      id: matchId,  // ❌ Hardcoded ID
      tournamentId,
      stage: 'FINAL',
      round,
      matchNumber: matchNum,
      status: MatchStatus.SCHEDULED,
    },
  });

  matchIdsByRound[round].push(matchId);
}
```

#### After (✅ Auto-generated UUIDs):
```typescript
for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
  // Prisma auto-generates UUID
  const match = await tx.tournamentMatch.create({
    data: {
      // ✅ No explicit ID - Prisma generates UUID
      tournamentId,
      stage: 'FINAL',
      round,
      matchNumber: matchNum,
      status: MatchStatus.SCHEDULED,
    },
  });

  matchIdsByRound[round].push(match.id);  // Use generated ID
}
```

### Third Place Match Fix

#### Before (❌):
```typescript
const thirdPlaceMatchId = `match-3rd-place`;  // ❌ Hardcoded

await tx.tournamentMatch.create({
  data: {
    id: thirdPlaceMatchId,
    // ...
  },
});

// Later usage
matchId: thirdPlaceMatchId
```

#### After (✅):
```typescript
const thirdPlaceMatch = await tx.tournamentMatch.create({
  data: {
    // ✅ Auto-generated UUID
    tournamentId,
    stage: 'FINAL',
    round: totalRounds,
    matchNumber: 99,
    status: MatchStatus.SCHEDULED,
  },
});

// Use generated ID
matchId: thirdPlaceMatch.id
```

## Benefits

### ✅ Advantages

1. **No More Conflicts**: Each match gets a globally unique UUID
2. **Better Database Design**: Aligns with UUID primary key convention
3. **Safer Regeneration**: Can safely regenerate matches without conflicts
4. **Multi-Tournament Safe**: Different tournaments never collide on IDs
5. **Production Ready**: UUIDs are standard for distributed systems

### 🔍 Schema Alignment

The Prisma schema already uses `@default(uuid())`:

```prisma
model TournamentMatch {
  id String @id @default(uuid())
  // ...
}
```

We were unnecessarily overriding this with hardcoded IDs.

## Testing

### Test Case 1: Generate Bracket
```bash
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "FINAL",
  "includeThirdPlaceMatch": true
}

# Should succeed with UUID IDs like:
# "d7f9a3b2-8c4e-4a1b-9d2f-3e5c6a7b8d9e"
```

### Test Case 2: Regenerate After Delete
```bash
# 1. Generate
POST /api/admin/tournaments/:id/matches/generate

# 2. Delete
DELETE /api/admin/tournaments/:id/matches

# 3. Generate again
POST /api/admin/tournaments/:id/matches/generate

# ✅ Should work without conflicts
```

### Test Case 3: Multiple Tournaments
```bash
# Generate matches for tournament 1
POST /api/admin/tournaments/tournament-1/matches/generate

# Generate matches for tournament 2
POST /api/admin/tournaments/tournament-2/matches/generate

# ✅ Both succeed with unique UUIDs
```

## Migration Notes

### For Existing Data

If you have existing matches with old IDs:

```sql
-- Check for old-style IDs
SELECT id FROM tournament_matches
WHERE id LIKE 'match-%' OR id = 'match-3rd-place';

-- These will continue to work
-- New matches will use UUIDs
```

### No Breaking Changes

- ✅ Existing matches with old IDs still work
- ✅ All queries by ID still work (UUID vs string doesn't matter)
- ✅ No database migration needed
- ✅ Backward compatible

## Related Code

### Files Modified:
1. [bracket.service.ts:136-168](apps/api-server/src/server/modules/tournament/application/bracket.service.ts#L136-L168) - Main match generation loop
2. [bracket.service.ts:281-350](apps/api-server/src/server/modules/tournament/application/bracket.service.ts#L281-L350) - Third place match generation

### No Changes Needed For:
- ❌ Group matches - Already use Prisma's auto-generated IDs
- ❌ Match participants - Reference match.id correctly
- ❌ Virtual participants - Still work with new UUIDs
- ❌ API responses - UUID strings work identically to old IDs

## Error Resolution

### Before Fix:
```
Error: Unique constraint failed on the fields: (`id`)
Code: P2002
Meta: { target: ["id"] }
```

### After Fix:
```json
{
  "success": true,
  "data": {
    "tournamentId": "abc123",
    "matches": [
      { "id": "d7f9a3b2-8c4e-4a1b-9d2f-3e5c6a7b8d9e", ... },
      { "id": "e8g0b4c3-9d5f-5b2c-0e3g-4f6d7b8c9e0f", ... }
    ]
  }
}
```

## Status: ✅ FIXED

Match generation now uses Prisma's auto-generated UUIDs. No more unique constraint conflicts.

## Future Considerations

### Optional: Match ID Prefix (Not Implemented)

If you want human-readable IDs in logs, you could add a custom generator:

```typescript
// Optional future enhancement
function generateMatchId(tournamentId: string, round: number, matchNum: number): string {
  return `${tournamentId}-r${round}-m${matchNum}-${randomUUID().slice(0, 8)}`;
}

// Example: "tour123-r1-m1-a3b4c5d6"
```

But current UUID approach is recommended for production systems.
