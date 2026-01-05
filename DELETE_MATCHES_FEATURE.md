# Delete All Matches Feature

## Overview

New feature to delete all matches for a tournament, useful for regenerating brackets/groups from scratch or fixing incorrect match generation.

## Endpoint

```
DELETE /api/admin/tournaments/:id/matches
```

**Authorization**: Admin only

## Use Cases

1. **Regenerate Bracket**: Delete all matches and regenerate bracket with different settings
2. **Fix Errors**: Remove incorrectly generated matches
3. **Reset Tournament**: Return tournament to pre-match state for testing
4. **Change Format**: Switch between different tournament formats

## Safety Features

### ✅ What Gets Deleted

- All tournament matches (SCHEDULED, IN_PROGRESS, CANCELLED status)
- All match participants (join table records)
- All virtual participants (placeholder participants like "Thắng trận 1")

### 🔒 What Remains Protected

- Tournament configuration and settings
- Real participants (registered users)
- Groups structure (for TWO_STAGES tournaments)
- Completed match history (CANNOT delete if any matches are completed)

### 🛡️ Safety Checks

1. **Admin Only**: Only users with ADMIN role can delete matches
2. **Completed Match Protection**: Cannot delete if ANY match has status COMPLETED
3. **Transaction-based**: All deletions happen in a single transaction (all or nothing)
4. **Tournament Validation**: Validates tournament exists before deletion

## Request

### Headers
```
Authorization: Bearer <admin-token>
```

### Example
```bash
curl -X DELETE \
  https://api.example.com/api/admin/tournaments/tournament-123/matches \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "data": {
    "deletedCount": 15,
    "message": "Đã xóa 15 trận đấu thành công"
  }
}
```

### Error: Completed Matches Exist (400 Bad Request)
```json
{
  "success": false,
  "error": "Không thể xóa tất cả trận đấu vì đã có 5 trận đã hoàn thành. Chỉ có thể xóa từng trận riêng lẻ."
}
```

### Error: Unauthorized (401)
```json
{
  "success": false,
  "error": "Chỉ quản trị viên mới có thể xóa trận đấu"
}
```

### Error: Tournament Not Found (404)
```json
{
  "success": false,
  "error": "Tournament not found"
}
```

## Common Workflows

### Workflow 1: Regenerate Bracket for Single Stage Tournament

```bash
# 1. Delete all existing matches
DELETE /api/admin/tournaments/:id/matches

# 2. Generate new bracket
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "FINAL",
  "includeThirdPlaceMatch": true
}
```

### Workflow 2: Regenerate Group Matches for Two Stages Tournament

```bash
# 1. Delete all existing matches
DELETE /api/admin/tournaments/:id/matches

# 2. Generate group matches for each group
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "GROUP",
  "groupId": "group-1",
  "matchupsPerPair": 1
}

POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "GROUP",
  "groupId": "group-2",
  "matchupsPerPair": 1
}
```

### Workflow 3: Fix Bracket and Regenerate

```bash
# 1. Check current matches
GET /api/admin/tournaments/:id/matches?stage=FINAL

# 2. Delete if not satisfied
DELETE /api/admin/tournaments/:id/matches

# 3. Regenerate with correct settings
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "FINAL",
  "includeThirdPlaceMatch": false
}
```

## Database Operations

The delete operation performs these steps in a transaction:

```typescript
// 1. Delete all match participants
DELETE FROM tournament_match_participants
WHERE match_id IN (
  SELECT id FROM tournament_matches WHERE tournament_id = :tournamentId
);

// 2. Delete all matches
DELETE FROM tournament_matches
WHERE tournament_id = :tournamentId;

// 3. Delete all virtual participants
DELETE FROM tournament_participants
WHERE tournament_id = :tournamentId AND is_virtual = true;
```

## Implementation Details

### Service Method: `MatchService.deleteAllMatches`

**Location**: `apps/api-server/src/server/modules/tournament/application/match.service.ts`

**Parameters**:
- `tournamentId: string` - Tournament ID
- `ctx: RequestContext` - Request context with user info

**Returns**:
```typescript
{
  deletedCount: number;
  message: string;
}
```

**Validations**:
1. User must be ADMIN
2. Tournament must exist
3. No matches can have COMPLETED status

### API Route: `DELETE /api/admin/tournaments/[id]/matches`

**Location**: `apps/api-server/src/app/api/admin/tournaments/[id]/matches/route.ts`

**Handler**: `async function DELETE(request, { params })`

## Testing

### Manual Test Cases

1. **✅ Success Case**: Delete matches with only SCHEDULED matches
2. **❌ Blocked Case**: Try to delete with COMPLETED matches
3. **❌ Auth Case**: Try to delete as non-admin user
4. **❌ Not Found**: Try to delete for non-existent tournament
5. **✅ Empty Case**: Delete when no matches exist (should succeed with count=0)

### Test Scenario

```bash
# Setup: Create tournament with participants
POST /api/admin/tournaments
POST /api/admin/tournaments/:id/participants

# Lock participants
POST /api/admin/tournaments/:id/lock-participants

# Generate bracket
POST /api/admin/tournaments/:id/matches/generate
# Response: 15 matches created

# Verify matches exist
GET /api/admin/tournaments/:id/matches
# Response: 15 matches

# Delete all matches
DELETE /api/admin/tournaments/:id/matches
# Response: deletedCount: 15

# Verify deletion
GET /api/admin/tournaments/:id/matches
# Response: 0 matches

# Regenerate with different settings
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "FINAL",
  "includeThirdPlaceMatch": false
}
```

## Postman Collection

Added to: **Admin - Tournament Matches (Unified)** section

**Request**: `6. Delete All Matches`
- Method: DELETE
- URL: `{{baseUrl}}/api/admin/tournaments/{{tournamentId}}/matches`
- Headers: `Authorization: Bearer {{adminToken}}`

## Swagger Documentation

Added Swagger/OpenAPI documentation to the route with:
- Full parameter descriptions
- Response schemas
- Error cases
- Safety checks explanation

Access at: `http://localhost:3000/api-docs`

## Security Considerations

1. **Admin Only**: Strict ADMIN role check prevents unauthorized deletions
2. **Completed Match Protection**: Preserves historical data by blocking deletion of completed matches
3. **Transaction Safety**: Atomic operation ensures database consistency
4. **Audit Trail**: Consider adding audit logs for match deletions (future enhancement)

## Future Enhancements

1. **Soft Delete**: Add soft delete option to preserve history
2. **Selective Delete**: Delete by stage (FINAL vs GROUP) or status
3. **Undo Feature**: Backup matches before deletion with restore capability
4. **Audit Logging**: Log who deleted matches and when
5. **Confirmation Step**: Add confirmation parameter to prevent accidental deletions

## Related Files

- Service: [match.service.ts:491-554](apps/api-server/src/server/modules/tournament/application/match.service.ts#L491-L554)
- Route: [matches/route.ts:355-368](apps/api-server/src/app/api/admin/tournaments/[id]/matches/route.ts#L355-L368)
- Postman: [PingClub_Admin_API.postman_collection.json:1863-1880](postman/PingClub_Admin_API.postman_collection.json#L1863-L1880)

## Status: ✅ COMPLETED

All implementation and documentation completed. Feature is ready for testing and use.
