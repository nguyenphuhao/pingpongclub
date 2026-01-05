# Tournament Default Status Change

## Overview

Changed the default status for new tournaments from **DRAFT** to **PENDING**.

## Reason

According to the tournament workflow requirements, tournaments should be created in **PENDING** status by default, ready for registration and participant management. The DRAFT status can still be used if explicitly set, but the default should be PENDING.

## Changes Made

### 1. Schema Update

**File**: `packages/database/prisma/schema.prisma`

**Before**:
```prisma
status TournamentStatus @default(DRAFT)
```

**After**:
```prisma
status TournamentStatus @default(PENDING)
```

### 2. Migration Created

**File**: `packages/database/prisma/migrations/20260105_change_tournament_default_status/migration.sql`

```sql
ALTER TABLE "tournaments" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"TournamentStatus";
```

## Impact

### ✅ What Changes

- **New tournaments** created without explicitly specifying status will default to `PENDING`
- Tournaments can now immediately accept participants after creation
- Bracket/group generation can proceed without status change

### ✅ What Stays the Same

- **Existing tournaments** keep their current status (no data migration)
- All status values (DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED) still available
- Can still create tournaments with DRAFT status by explicitly setting it
- All validation rules remain the same

## Tournament Status Flow

```
┌─────────┐
│  DRAFT  │ (Optional - explicit only)
└────┬────┘
     │
     ▼
┌─────────┐
│ PENDING │ ◄─── NEW DEFAULT
└────┬────┘
     │ Generate bracket/groups
     ▼
┌─────────────┐
│ IN_PROGRESS │
└──────┬──────┘
       │
       ├─────► ┌───────────┐
       │       │ COMPLETED │
       │       └───────────┘
       │
       └─────► ┌───────────┐
               │ CANCELLED │
               └───────────┘
```

## API Behavior

### Creating Tournament (No Status Specified)

**Before**:
```bash
POST /api/admin/tournaments
{
  "name": "Championship 2026",
  "gameType": "SINGLE_STAGE"
}
# Result: status = DRAFT
```

**After**:
```bash
POST /api/admin/tournaments
{
  "name": "Championship 2026",
  "gameType": "SINGLE_STAGE"
}
# Result: status = PENDING
```

### Creating Tournament (Status Explicitly Set)

```bash
POST /api/admin/tournaments
{
  "name": "Championship 2026",
  "gameType": "SINGLE_STAGE",
  "status": "DRAFT"  # Still works!
}
# Result: status = DRAFT
```

## Benefits

1. **Simpler Workflow**: No need to change status from DRAFT to PENDING
2. **Immediate Registration**: Tournaments ready for participants right after creation
3. **Less Steps**: Can generate bracket/groups immediately after locking participants
4. **Clearer Intent**: PENDING clearly indicates "ready and waiting for participants"
5. **DRAFT Optional**: DRAFT status only used when specifically needed

## Migration Commands

Apply this migration:

```bash
# Deploy migration
yarn workspace @pingclub/database prisma migrate deploy

# Regenerate Prisma Client
yarn workspace @pingclub/database prisma generate
```

## Validation Rules

### Bracket/Group Generation

**Old Rule**:
```
❌ Tournament status must be PENDING to generate bracket
```

**Current Rule** (unchanged):
```
✅ Tournament status must be PENDING to generate bracket
✅ Participants must be locked (participantsLocked = true)
```

Since new tournaments default to PENDING, this "just works" now without status change.

## Testing

### Test Case 1: Create Tournament Without Status

```bash
POST /api/admin/tournaments
{
  "name": "Test Tournament",
  "gameType": "SINGLE_STAGE"
}

# Expected: status = PENDING
```

### Test Case 2: Create Tournament With DRAFT

```bash
POST /api/admin/tournaments
{
  "name": "Draft Tournament",
  "gameType": "SINGLE_STAGE",
  "status": "DRAFT"
}

# Expected: status = DRAFT (explicit override)
```

### Test Case 3: Immediate Workflow

```bash
# 1. Create tournament (defaults to PENDING)
POST /api/admin/tournaments { ... }

# 2. Add participants
POST /api/admin/tournaments/:id/participants/bulk { ... }

# 3. Lock participants
POST /api/admin/tournaments/:id/participants/lock

# 4. Generate bracket (no status change needed!)
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "FINAL",
  "includeThirdPlaceMatch": true
}
```

## Backward Compatibility

✅ **Fully backward compatible**

- Existing code works without changes
- Can still use DRAFT status if needed
- All API endpoints unchanged
- No breaking changes

## Related Documentation

- [TOURNAMENT_ARCHITECTURE.md](./TOURNAMENT_ARCHITECTURE.md) - Tournament system architecture
- [TOURNAMENT_ENDPOINTS_SUMMARY.md](./TOURNAMENT_ENDPOINTS_SUMMARY.md) - API endpoints
- [API_UNIFICATION_GUIDE.md](./API_UNIFICATION_GUIDE.md) - Match generation unified API

## Summary

This is a **non-breaking change** that simplifies the tournament creation workflow by setting a more appropriate default status. The DRAFT status is still available when explicitly needed, but most tournaments will start in PENDING status ready for immediate use.
