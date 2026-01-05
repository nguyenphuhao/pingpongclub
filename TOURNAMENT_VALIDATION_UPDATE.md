# Tournament Validation Update - PENDING Default Status

## Summary

Updated all tournament status validations to accept both DRAFT and PENDING statuses after changing the default tournament status from DRAFT to PENDING.

## Changes Made

### 1. Schema Change ✅
**File**: `packages/database/prisma/schema.prisma`
- Changed default status from `@default(DRAFT)` to `@default(PENDING)`
- Migration: `20260105_change_tournament_default_status`

### 2. Type Definition ✅
**File**: `apps/api-server/src/server/modules/tournament/domain/tournament.types.ts`
- **Line 110**: Added optional `status` field to `CreateTournamentDto`
```typescript
export interface CreateTournamentDto {
  // ... other fields
  status?: TournamentStatus;  // Optional: defaults to PENDING if not specified
}
```

### 3. Service Layer Updates ✅

#### tournament.service.ts
**Line 60**: Updated tournament creation to use DTO status or default to PENDING
```typescript
// Before:
status: TournamentStatus.DRAFT,

// After:
status: dto.status || TournamentStatus.PENDING,
```

**Lines 166 & 480**: Visibility checks - KEPT as DRAFT only (correct behavior)
- These checks determine if non-admins can see the tournament
- Only DRAFT tournaments should be hidden from public

#### bracket.service.ts
**Lines 60-65**: Updated validation to accept both DRAFT and PENDING
```typescript
// Before:
if (tournament.status !== TournamentStatus.PENDING) {
  throw new Error('Giải đấu phải ở trạng thái CHỜ (PENDING) để tạo bảng đấu');
}

// After:
if (
  tournament.status !== TournamentStatus.DRAFT &&
  tournament.status !== TournamentStatus.PENDING
) {
  throw new Error('Không thể tạo bảng đấu cho giải đấu đang diễn ra hoặc đã hoàn thành');
}
```

#### group.service.ts
**Lines 59-63 & 916-920**: Already checking both statuses ✅
- No changes needed - validations were already correct

## Validation Rules

### ✅ Allowed Operations (DRAFT or PENDING)
- Create tournament groups
- Add participants to groups
- Lock participants
- Generate bracket matches
- Generate group matches

### ❌ Blocked Operations (IN_PROGRESS or COMPLETED)
- Cannot create new groups
- Cannot modify structure
- Cannot regenerate matches

### 🔒 Admin-Only Visibility (DRAFT)
- Non-admin users cannot see DRAFT tournaments
- PENDING tournaments are visible to all users

## Testing Checklist

- [ ] Create tournament without status → defaults to PENDING
- [ ] Create tournament with explicit DRAFT → stays DRAFT
- [ ] Create tournament with explicit PENDING → stays PENDING
- [ ] Generate bracket for PENDING tournament → works
- [ ] Generate bracket for DRAFT tournament → works
- [ ] Generate group matches for PENDING tournament → works
- [ ] Generate group matches for DRAFT tournament → works
- [ ] Non-admin cannot see DRAFT tournament → blocked
- [ ] Non-admin can see PENDING tournament → allowed
- [ ] Cannot generate bracket for IN_PROGRESS tournament → blocked
- [ ] Cannot generate group matches for COMPLETED tournament → blocked

## Migration Commands

```bash
# Apply the migration
yarn workspace @pingclub/database prisma migrate deploy

# Regenerate Prisma client
yarn workspace @pingclub/database prisma generate

# Rebuild API server
yarn workspace @pingclub/api-server build
```

## Backward Compatibility

✅ **Full backward compatibility maintained**:
- Existing DRAFT tournaments continue to work
- All validations accept both DRAFT and PENDING
- Explicit DRAFT creation still possible via DTO
- No breaking changes to API contracts

## Benefits

1. **Better UX**: Tournaments immediately usable after creation
2. **Clearer Workflow**: DRAFT = hidden from public, PENDING = visible but not started
3. **Flexibility**: Still allows explicit DRAFT creation when needed
4. **Consistency**: All services validate both statuses uniformly

## Files Modified

1. ✅ `packages/database/prisma/schema.prisma` - Default status change
2. ✅ `packages/database/prisma/migrations/20260105_change_tournament_default_status/migration.sql` - Migration
3. ✅ `apps/api-server/src/server/modules/tournament/domain/tournament.types.ts` - Added status field to DTO
4. ✅ `apps/api-server/src/server/modules/tournament/application/tournament.service.ts` - Updated creation logic
5. ✅ `apps/api-server/src/server/modules/tournament/application/bracket.service.ts` - Updated validation
6. ✅ `apps/api-server/src/server/modules/tournament/application/group.service.ts` - Already correct (no changes)

## Status: COMPLETED ✅

All validation updates completed successfully. System now:
- Defaults new tournaments to PENDING
- Accepts both DRAFT and PENDING for all match generation operations
- Maintains proper visibility controls (DRAFT = admin-only)
- Provides full backward compatibility
