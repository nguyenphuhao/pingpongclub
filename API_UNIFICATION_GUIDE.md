# API Unification Guide - Match Generation Endpoints

## Overview

We have unified the match generation endpoints to provide a consistent, cleaner API design. The separate bracket and group generation endpoints have been consolidated into a single unified endpoint.

## What Changed

### Old Pattern (Deprecated)

Previously, match generation used **two separate endpoints** depending on the stage type:

```bash
# For FINAL stage (bracket)
POST /api/admin/tournaments/:id/bracket/generate
{
  "includeThirdPlaceMatch": true
}

# For GROUP stage (round robin)
POST /api/admin/tournaments/:id/groups/:gid/generate-matches
{
  "matchupsPerPair": 2
}
```

**Problems with old pattern**:
- ❌ Inconsistent endpoint structure
- ❌ Different URL patterns for same operation (match generation)
- ❌ Harder to discover and understand
- ❌ Duplicate logic in implementation

### New Pattern (Recommended)

Now, match generation uses **one unified endpoint** with a `stage` parameter:

```bash
# For FINAL stage (bracket)
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "FINAL",
  "includeThirdPlaceMatch": true
}

# For GROUP stage (round robin)
POST /api/admin/tournaments/:id/matches/generate
{
  "stage": "GROUP",
  "groupId": "group-A-id",
  "matchupsPerPair": 2
}
```

**Benefits of new pattern**:
- ✅ Consistent endpoint structure
- ✅ Single URL pattern for all match generation
- ✅ Easier to discover and understand
- ✅ Cleaner implementation
- ✅ Follows REST best practices

---

## Migration Guide

### Step 1: Update Bracket Generation Calls

**Before**:
```javascript
const response = await fetch(`/api/admin/tournaments/${tournamentId}/bracket/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    includeThirdPlaceMatch: true
  })
});
```

**After**:
```javascript
const response = await fetch(`/api/admin/tournaments/${tournamentId}/matches/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stage: 'FINAL',
    includeThirdPlaceMatch: true
  })
});
```

### Step 2: Update Group Match Generation Calls

**Before**:
```javascript
const response = await fetch(`/api/admin/tournaments/${tournamentId}/groups/${groupId}/generate-matches`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchupsPerPair: 2
  })
});
```

**After**:
```javascript
const response = await fetch(`/api/admin/tournaments/${tournamentId}/matches/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stage: 'GROUP',
    groupId: groupId,
    matchupsPerPair: 2
  })
});
```

### Step 3: Handle Deprecation Warnings

The old endpoints will return deprecation headers:

```http
HTTP/1.1 200 OK
X-Deprecated: true
X-Deprecation-Message: Use POST /api/admin/tournaments/:id/matches/generate with stage="FINAL" instead
```

You can check for these headers and show warnings to users:

```javascript
const response = await fetch(...);

if (response.headers.get('X-Deprecated') === 'true') {
  const message = response.headers.get('X-Deprecation-Message');
  console.warn(`⚠️ API Deprecation: ${message}`);
}
```

---

## API Reference

### Unified Match Generation Endpoint

**Endpoint**: `POST /api/admin/tournaments/:id/matches/generate`

**Request Body**:

```typescript
interface GenerateMatchesDto {
  stage: 'FINAL' | 'GROUP';           // Required: stage type
  groupId?: string;                   // Required if stage = GROUP
  includeThirdPlaceMatch?: boolean;   // Optional: for FINAL stage
  matchupsPerPair?: number;           // Optional: for GROUP stage (default: 1)
}
```

**Response (FINAL stage)**:

```json
{
  "success": true,
  "data": {
    "stage": "FINAL",
    "message": "Đã tạo bảng đấu thành công",
    "tournamentId": "tour-123",
    "format": "SINGLE_ELIMINATION",
    "totalRounds": 3,
    "totalMatches": 7,
    "rounds": [...]
  }
}
```

**Response (GROUP stage)**:

```json
{
  "success": true,
  "data": {
    "stage": "GROUP",
    "groupId": "group-A",
    "message": "Đã tạo lịch thi đấu cho bảng thành công",
    "matches": [...],
    "totalMatches": 12
  }
}
```

---

## Implementation Details

### Files Created

1. **`/tournaments/[id]/matches/generate/route.ts`**
   - New unified endpoint
   - Routes to BracketService or GroupService based on `stage` parameter
   - Validates required fields
   - Returns consistent response format

### Files Modified

1. **`/tournaments/[id]/bracket/generate/route.ts`**
   - Added `deprecated: true` to Swagger docs
   - Added deprecation headers to response
   - Still functional but marked for removal

2. **`/tournaments/[id]/groups/[gid]/generate-matches/route.ts`**
   - Added `deprecated: true` to Swagger docs
   - Added deprecation headers to response
   - Still functional but marked for removal

3. **`match.types.ts`**
   - Added `GenerateMatchesDto` interface
   - Defines unified request body structure

4. **`TOURNAMENT_ENDPOINTS_SUMMARY.md`**
   - Added new unified endpoint section at the top
   - Marked old endpoints as deprecated
   - Updated summary tables
   - Added migration examples

---

## Timeline

- **Today**: Unified endpoint created, old endpoints deprecated
- **Next 2-4 weeks**: Update frontend code to use unified endpoint
- **After frontend migration**: Remove old deprecated endpoints (breaking change)

---

## Backward Compatibility

✅ **The old endpoints still work** and will continue to work until all clients migrate.

✅ **No breaking changes yet** - this is a graceful deprecation with warnings.

⚠️ **Clients should migrate ASAP** to avoid issues when old endpoints are removed.

---

## Testing

### Test FINAL Stage Generation

```bash
curl -X POST http://localhost:3000/api/admin/tournaments/tour-123/matches/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "stage": "FINAL",
    "includeThirdPlaceMatch": true
  }'
```

### Test GROUP Stage Generation

```bash
curl -X POST http://localhost:3000/api/admin/tournaments/tour-123/matches/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "stage": "GROUP",
    "groupId": "group-A",
    "matchupsPerPair": 2
  }'
```

### Test Old Endpoints (Should Return Deprecation Headers)

```bash
# Test old bracket endpoint
curl -X POST http://localhost:3000/api/admin/tournaments/tour-123/bracket/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -D - \
  -d '{ "includeThirdPlaceMatch": true }'

# Check for headers:
# X-Deprecated: true
# X-Deprecation-Message: Use POST /api/admin/tournaments/:id/matches/generate with stage="FINAL" instead
```

---

## FAQ

### Q: Do I need to migrate immediately?

**A**: No, the old endpoints still work. But you should migrate within the next few weeks before they are removed.

### Q: What if I'm still using the old endpoints?

**A**: They will continue to work and return deprecation headers. Update your code to use the new unified endpoint.

### Q: Will the response format change?

**A**: No, the response format remains the same. Only the request URL and body structure changed.

### Q: Can I use both old and new endpoints simultaneously?

**A**: Yes, during the migration period both endpoints work. But aim to migrate fully to the new endpoint.

### Q: When will the old endpoints be removed?

**A**: After all known clients have migrated (estimated 2-4 weeks). A final announcement will be made before removal.

---

## Support

If you encounter issues during migration:

1. Check the [TOURNAMENT_ENDPOINTS_SUMMARY.md](./TOURNAMENT_ENDPOINTS_SUMMARY.md) for updated documentation
2. Review the Swagger docs at `http://localhost:3000/api-docs`
3. Check the deprecation headers for guidance
4. Refer to this guide's migration examples

---

## Related Documentation

- [TOURNAMENT_ENDPOINTS_SUMMARY.md](./TOURNAMENT_ENDPOINTS_SUMMARY.md) - Complete endpoint reference
- [VIRTUAL_PARTICIPANTS_GUIDE.md](./VIRTUAL_PARTICIPANTS_GUIDE.md) - Virtual participants system
- [TOURNAMENT_ARCHITECTURE.md](./TOURNAMENT_ARCHITECTURE.md) - System architecture
