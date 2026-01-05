# Virtual Participants System - Implementation Guide

## Overview

Implemented a complete virtual participants system that allows tournament brackets to be fully generated upfront with placeholders (e.g., "Nhất bảng A", "Thắng trận 1") for all rounds, not just round 1.

## Key Features

✅ **Complete Bracket Generation**: All rounds are created upfront, not just round 1
✅ **Virtual Participants**: Placeholder participants with meaningful names like "Nhất bảng A" or "Thắng trận 1 (Vòng 1)"
✅ **TWO_STAGES Support**: Automatic virtual participant creation for group advancing spots
✅ **Manual Advancement**: Admin can manually replace virtual participants with real participants
✅ **JSON Metadata**: Tracks advancing source (from which group/match) for each virtual participant

## Database Changes

### Schema Updates

Added 3 new fields to `TournamentParticipant`:

```prisma
model TournamentParticipant {
  // ... existing fields
  userId       String? @map("user_id") // NOW NULLABLE for virtual participants

  // New fields
  isVirtual       Boolean @default(false) @map("is_virtual")
  displayName     String? @map("display_name") // "Nhất bảng A", "Thắng trận 1"
  advancingSource String? @map("advancing_source") // JSON metadata
}
```

### Advancing Source JSON Format

```typescript
// For group advancing spots (TWO_STAGES)
{
  "type": "group",
  "groupId": "group-A-id",
  "groupName": "Group A",
  "rank": 1  // 1 = first place, 2 = second place
}

// For match winners/losers
{
  "type": "match",
  "matchId": "match-1",
  "position": "winner" | "loser"
}
```

## API Changes

### 1. Enhanced Bracket Generation

**Endpoint**: `POST /api/admin/tournaments/:id/bracket/generate`

**Behavior Changes**:

- **BEFORE**: Only created round 1 matches with participants, rounds 2+ were empty (TBD)
- **AFTER**: Creates ALL rounds with participants:
  - Round 1: Real participants (SINGLE_STAGE) or Virtual participants (TWO_STAGES)
  - Rounds 2+: Virtual participants referencing winners of previous matches

**For SINGLE_STAGE Tournaments**:
```json
{
  "includeThirdPlaceMatch": true
}
```

- Round 1: Uses all CHECKED_IN participants
- Round 2+: Creates virtual participants like "Thắng trận 1 (Vòng 1)"

**For TWO_STAGES Tournaments**:
```json
{
  "includeThirdPlaceMatch": true
}
```

- **Round 1**: Creates virtual participants for each advancing spot:
  - "Nhất bảng A" (rank 1 from Group A)
  - "Nhì bảng A" (rank 2 from Group A)
  - "Nhất bảng B", "Nhì bảng B", etc.
- **Round 2+**: Creates virtual participants for match winners

### 2. New Manual Advancement Endpoint

**Endpoint**: `POST /api/admin/tournaments/:id/matches/:matchId/advance`

**Purpose**: Manually replace a virtual participant with a real participant

**Request Body**:
```json
{
  "realParticipantId": "participant-123",
  "position": "winner",  // or "loser" for 3rd place match
  "rank": 1  // Optional: for TWO_STAGES group advancement
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Đã advance participant thành công",
    "updatedMatches": ["match-5", "match-6"],
    "advancedCount": 2
  }
}
```

**Use Cases**:

1. **TWO_STAGES - Advance group winners to bracket**:
```bash
# After Group A completes, advance 1st place to bracket
POST /tournaments/tour-1/matches/group-A-final/advance
{
  "realParticipantId": "participant-winner-A",
  "position": "winner",
  "rank": 1
}
```

2. **Advance match winner to next round**:
```bash
# After round 1 match completes, advance winner to round 2
POST /tournaments/tour-1/matches/match-1/advance
{
  "realParticipantId": "participant-123",
  "position": "winner"
}
```

3. **Advance loser to 3rd place match**:
```bash
# After semifinal, advance loser to 3rd place match
POST /tournaments/tour-1/matches/semi-1/advance
{
  "realParticipantId": "participant-loser",
  "position": "loser"
}
```

## New Files Created

### 1. Virtual Participant Helper

**File**: `apps/api-server/src/server/modules/tournament/application/helpers/virtual-participant.helper.ts`

**Key Methods**:

```typescript
class VirtualParticipantHelper {
  // Create virtual participant for group advancing spot
  async createGroupAdvancingVirtualParticipant(
    tournamentId: string,
    group: { id, name, displayName },
    rank: number
  ): Promise<string>

  // Create virtual participant for match winner/loser
  async createMatchAdvancingVirtualParticipant(
    tournamentId: string,
    matchId: string,
    matchNumber: number,
    round: number,
    position: 'winner' | 'loser'
  ): Promise<string>

  // Create all virtual participants for TWO_STAGES tournament
  async createVirtualParticipantsForTwoStages(
    tournamentId: string
  ): Promise<VirtualParticipant[]>

  // Replace virtual with real participant
  async replaceVirtualParticipant(
    virtualParticipantId: string,
    realParticipantId: string
  ): Promise<void>
}
```

### 2. Advancement API Route

**File**: `apps/api-server/src/app/api/admin/tournaments/[id]/matches/[matchId]/advance/route.ts`

Admin-only endpoint for manual advancement.

## Modified Files

### 1. Prisma Schema

**File**: `packages/database/prisma/schema.prisma`

- Made `userId` nullable
- Added `isVirtual`, `displayName`, `advancingSource` fields
- Updated unique constraint to exclude virtual participants

### 2. Bracket Service

**File**: `apps/api-server/src/server/modules/tournament/application/bracket.service.ts`

**Key Changes**:

1. **generateBracket Method**:
   - For TWO_STAGES: Creates virtual participants for all advancing spots BEFORE generating bracket
   - Generates matches for ALL rounds (not just round 1)
   - Creates virtual participants for rounds 2+ that reference previous match winners

2. **getBracket Method**:
   - Updated participant name mapping to handle both real and virtual participants
   - Shows `displayName` for virtual participants
   - Shows user's display name for real participants

## Workflow Examples

### TWO_STAGES Tournament Workflow

```
1. Create tournament with TWO_STAGES
   └─> gameType: TWO_STAGES

2. Create groups (A, B, C, D)
   └─> Each group has participantsAdvancing: 2

3. Add participants and assign to groups
   └─> Participants get groupId assigned

4. Generate group matches and complete them
   └─> POST /tournaments/:id/groups/A/generate-matches
   └─> Determine 1st and 2nd place for each group

5. Generate bracket (creates virtual participants automatically)
   └─> POST /tournaments/:id/bracket/generate
   └─> Creates:
       - "Nhất bảng A", "Nhì bảng A"
       - "Nhất bảng B", "Nhì bảng B"
       - etc. for all groups
       - "Thắng trận 1 (Vòng 1)" for round 2
       - "Thắng trận 1 (Vòng 2)" for finals

6. Manually advance group winners to bracket
   └─> POST /tournaments/:id/matches/group-A-final/advance
       { realParticipantId: "winner-A", position: "winner", rank: 1 }
   └─> Replaces "Nhất bảng A" with actual winner

7. Play round 1 matches and advance winners
   └─> POST /tournaments/:id/matches/match-1/advance
       { realParticipantId: "winner-123", position: "winner" }
   └─> Replaces "Thắng trận 1 (Vòng 1)" with actual winner

8. Continue until finals
```

### SINGLE_STAGE Tournament Workflow

```
1. Create tournament with SINGLE_STAGE
   └─> gameType: SINGLE_STAGE

2. Add participants and check them in
   └─> status: CHECKED_IN

3. Lock participants and generate bracket
   └─> POST /tournaments/:id/participants/lock
   └─> POST /tournaments/:id/bracket/generate
   └─> Creates:
       - Round 1: Real participants (seeded 1 vs 16, 2 vs 15, etc.)
       - Round 2: Virtual "Thắng trận 1 (Vòng 1)" placeholders
       - Semifinals: Virtual "Thắng trận 1 (Vòng 2)" placeholders
       - Finals: Virtual "Thắng trận 1 (Vòng 3)" placeholders

4. Play matches and manually advance winners
   └─> After each match completes:
       POST /tournaments/:id/matches/:matchId/advance
       { realParticipantId: "winner-id", position: "winner" }

5. Continue until finals
```

## Display Names Examples

### Group Advancing (TWO_STAGES)

| Rank | Group | Display Name |
|------|-------|--------------|
| 1 | Group A (Bảng A) | "Nhất Bảng A" |
| 2 | Group A (Bảng A) | "Nhì Bảng A" |
| 1 | Group B (Bảng B) | "Nhất Bảng B" |
| 2 | Group C (Bảng C) | "Nhì Bảng C" |

### Match Advancing (All Tournament Types)

| Source | Display Name |
|--------|--------------|
| Winner of Match 1, Round 1 | "Thắng trận 1 (Vòng 1)" |
| Winner of Match 3, Round 2 | "Thắng trận 3 (Vòng 2)" |
| Loser of Match 1, Semifinals | "Thua trận 1 (Vòng 3)" |

## Benefits

1. **Complete Bracket Visibility**: Admin can see and schedule ALL matches upfront
2. **Clear Placeholders**: Instead of "TBD", shows meaningful names like "Nhất bảng A"
3. **Flexible Scheduling**: Can assign matchDate and courtNumber to all rounds before tournament starts
4. **Manual Control**: Admin explicitly advances winners (no automatic advancement)
5. **Audit Trail**: `advancingSource` JSON tracks where each participant should come from

## Migration

Run these commands to apply the schema changes:

```bash
yarn workspace @pingclub/database prisma migrate deploy
yarn workspace @pingclub/database prisma generate
```

Two migrations were created:
1. `20260105_remove_draft_match_status` - Removes DRAFT status (from previous work)
2. `20260105_add_virtual_participants` - Adds virtual participant support

## Testing

To test the implementation:

1. Create a TWO_STAGES tournament with groups
2. Add participants to groups
3. Generate bracket: `POST /tournaments/:id/bracket/generate`
4. Verify bracket has virtual participants:
   - `GET /tournaments/:id/bracket`
   - Check match participants show "Nhất bảng A", "Thắng trận 1", etc.
5. Test advancement:
   - Complete a match
   - Call advance endpoint with winner
   - Verify next match now shows real participant name

## Future Enhancements

Potential future improvements:

1. **Auto-advancement**: Automatically replace virtual participants when match is completed
2. **Batch advancement**: Advance multiple winners at once
3. **UI Component**: Frontend component to visualize and manage advancements
4. **Validation**: Prevent advancing wrong participant to wrong spot
5. **Rollback**: Ability to undo advancement and restore virtual participant

## Related Documentation

- [TOURNAMENT_ARCHITECTURE.md](./TOURNAMENT_ARCHITECTURE.md) - Overall system architecture
- [TOURNAMENT_API.md](./TOURNAMENT_API.md) - Complete API reference
- [MATCHES_API_GUIDE.md](./MATCHES_API_GUIDE.md) - Match management APIs
