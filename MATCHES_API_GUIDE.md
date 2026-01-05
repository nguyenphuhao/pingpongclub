# Matches API Guide

## 📚 Overview

Generic Matches API hỗ trợ cả **SINGLE_ELIMINATION** (bracket) và **ROUND_ROBIN** (group) matches trong một endpoint thống nhất.

**Lợi ích:**
- ✅ Một API duy nhất cho tất cả matches
- ✅ Hỗ trợ filtering linh hoạt (stage, group, status, round)
- ✅ Pagination built-in
- ✅ Bao gồm cả TBD matches (placeholders)
- ✅ Thống nhất data format

---

## 🎯 Endpoints

### 1. List All Matches

**Endpoint**: `GET /api/admin/tournaments/:id/matches`

**Description**: Lấy tất cả matches của tournament với filtering và pagination

**Query Parameters**:

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `stage` | string | `FINAL`, `GROUP` | Filter by stage type |
| `groupId` | string | `<group-id>` | Filter by specific group |
| `status` | string | `DRAFT`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` | Filter by status |
| `round` | integer | `1`, `2`, `3`, ... | Filter by round number |
| `page` | integer | `1` (default) | Page number |
| `limit` | integer | `50` (default) | Items per page |

**Examples**:

```bash
# Get all matches
GET /api/admin/tournaments/tour-123/matches

# Get only bracket matches (FINAL stage)
GET /api/admin/tournaments/tour-123/matches?stage=FINAL

# Get only group matches
GET /api/admin/tournaments/tour-123/matches?stage=GROUP

# Get matches for specific group
GET /api/admin/tournaments/tour-123/matches?groupId=group-A

# Get only scheduled matches
GET /api/admin/tournaments/tour-123/matches?status=SCHEDULED

# Get round 1 matches only
GET /api/admin/tournaments/tour-123/matches?round=1

# Combined filters
GET /api/admin/tournaments/tour-123/matches?stage=GROUP&status=SCHEDULED&page=1&limit=20
```

**Response**:

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "match-1",
        "tournamentId": "tour-123",
        "groupId": null,
        "stage": "FINAL",
        "round": 1,
        "matchNumber": 1,
        "bracketPosition": null,
        "matchDate": "2026-01-15T10:00:00Z",
        "courtNumber": "Court 1",
        "status": "SCHEDULED",
        "winnerId": null,
        "finalScore": null,
        "gameScores": null,
        "isPlacementMatch": false,
        "placementRank": null,
        "createdAt": "2026-01-04T10:00:00Z",
        "updatedAt": "2026-01-04T10:00:00Z",
        "participants": [
          {
            "id": "mp-1",
            "participantId": "part-1",
            "position": 1,
            "isWinner": null,
            "score": null,
            "participant": {
              "id": "part-1",
              "tournamentId": "tour-123",
              "userId": "user-1",
              "groupId": null,
              "seed": 1,
              "status": "CHECKED_IN",
              "user": {
                "id": "user-1",
                "email": "player1@example.com",
                "phone": "+84901234567",
                "firstName": "Nguyen",
                "lastName": "Van A",
                "nickname": "Pro Player",
                "displayName": "Nguyen Van A",
                "ratingPoints": 1500
              }
            }
          },
          {
            "id": "mp-2",
            "participantId": "part-8",
            "position": 2,
            "isWinner": null,
            "score": null,
            "participant": {
              "user": {
                "displayName": "Player 8",
                "ratingPoints": 1200
              }
            }
          }
        ],
        "group": null
      },
      {
        "id": "match-5",
        "stage": "FINAL",
        "round": 2,
        "matchNumber": 1,
        "status": "SCHEDULED",
        "participants": [],
        "group": null
      }
    ],
    "meta": {
      "total": 15,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

**Key Fields**:

- `participants: []` = TBD match (placeholder cho later rounds)
- `stage: "FINAL"` = Bracket match (single elimination)
- `stage: "GROUP"` = Group match (round robin)
- `groupId: null` = Bracket match
- `groupId: "<id>"` = Group match
- `group: {...}` = Group info (only for GROUP stage matches)

---

### 2. Get Single Match

**Endpoint**: `GET /api/admin/tournaments/:id/matches/:matchId`

**Description**: Lấy chi tiết một match cụ thể

**Example**:

```bash
GET /api/admin/tournaments/tour-123/matches/match-1
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "match-1",
    "tournamentId": "tour-123",
    "groupId": "group-A",
    "stage": "GROUP",
    "round": 1,
    "matchNumber": 1,
    "status": "COMPLETED",
    "matchDate": "2026-01-15T10:00:00Z",
    "courtNumber": "Court 1",
    "winnerId": "part-1",
    "finalScore": "3-1",
    "gameScores": [
      {
        "game": 1,
        "player1Score": 11,
        "player2Score": 9,
        "duration": 300
      },
      {
        "game": 2,
        "player1Score": 11,
        "player2Score": 7,
        "duration": 280
      },
      {
        "game": 3,
        "player1Score": 9,
        "player2Score": 11,
        "duration": 320
      },
      {
        "game": 4,
        "player1Score": 11,
        "player2Score": 8,
        "duration": 290
      }
    ],
    "participants": [
      {
        "id": "mp-1",
        "participantId": "part-1",
        "position": 1,
        "isWinner": true,
        "score": "3",
        "participant": {
          "user": {
            "displayName": "Player 1",
            "ratingPoints": 1500
          }
        }
      },
      {
        "id": "mp-2",
        "participantId": "part-2",
        "position": 2,
        "isWinner": false,
        "score": "1",
        "participant": {
          "user": {
            "displayName": "Player 2",
            "ratingPoints": 1400
          }
        }
      }
    ],
    "group": {
      "id": "group-A",
      "name": "Group A",
      "displayName": "Bảng A"
    }
  }
}
```

---

### 3. Get Match Statistics

**Endpoint**: `GET /api/admin/tournaments/:id/matches/stats`

**Description**: Lấy thống kê về matches

**Example**:

```bash
GET /api/admin/tournaments/tour-123/matches/stats
```

**Response**:

```json
{
  "success": true,
  "data": {
    "total": 22,
    "byStage": [
      {
        "stage": "GROUP",
        "count": 12
      },
      {
        "stage": "FINAL",
        "count": 10
      }
    ],
    "byStatus": [
      {
        "status": "SCHEDULED",
        "count": 15
      },
      {
        "status": "COMPLETED",
        "count": 5
      },
      {
        "status": "IN_PROGRESS",
        "count": 2
      }
    ]
  }
}
```

---

## 🎯 Use Cases

### Use Case 1: Display All Matches for a Tournament

```typescript
// Get all matches with pagination
const response = await fetch(
  '/api/admin/tournaments/tour-123/matches?page=1&limit=20'
);
const { data } = await response.json();

// Render matches
data.data.forEach(match => {
  const isTBD = match.participants.length === 0;
  const stage = match.stage === 'FINAL' ? 'Bracket' : 'Group';

  console.log(`${stage} - Round ${match.round} - Match ${match.matchNumber}`);

  if (isTBD) {
    console.log('  Player 1: TBD');
    console.log('  Player 2: TBD');
  } else {
    match.participants.forEach(p => {
      console.log(`  Player ${p.position}: ${p.participant.user.displayName}`);
    });
  }
});
```

---

### Use Case 2: Filter Bracket Matches Only

```typescript
// Get only FINAL stage matches (bracket)
const response = await fetch(
  '/api/admin/tournaments/tour-123/matches?stage=FINAL'
);
const { data } = await response.json();

// These are bracket matches with TBD placeholders
const tbdMatches = data.data.filter(m => m.participants.length === 0);
console.log(`${tbdMatches.length} matches waiting for winners`);
```

---

### Use Case 3: Group Matches for Specific Group

```typescript
// Get matches for Group A
const response = await fetch(
  '/api/admin/tournaments/tour-123/matches?groupId=group-A&stage=GROUP'
);
const { data } = await response.json();

// All matches in Group A
data.data.forEach(match => {
  console.log(`Round ${match.round}, Match ${match.matchNumber}`);
  console.log(`Status: ${match.status}`);
});
```

---

### Use Case 4: Track Match Progress

```typescript
// Get matches by status
const scheduled = await fetch(
  '/api/admin/tournaments/tour-123/matches?status=SCHEDULED'
).then(r => r.json());

const inProgress = await fetch(
  '/api/admin/tournaments/tour-123/matches?status=IN_PROGRESS'
).then(r => r.json());

const completed = await fetch(
  '/api/admin/tournaments/tour-123/matches?status=COMPLETED'
).then(r => r.json());

console.log(`Scheduled: ${scheduled.data.meta.total}`);
console.log(`In Progress: ${inProgress.data.meta.total}`);
console.log(`Completed: ${completed.data.meta.total}`);
```

---

### Use Case 5: Dashboard Statistics

```typescript
// Get statistics for dashboard
const stats = await fetch(
  '/api/admin/tournaments/tour-123/matches/stats'
).then(r => r.json());

const { total, byStage, byStatus } = stats.data;

// Render dashboard
console.log(`Total Matches: ${total}`);
console.log('\nBy Stage:');
byStage.forEach(s => {
  console.log(`  ${s.stage}: ${s.count}`);
});
console.log('\nBy Status:');
byStatus.forEach(s => {
  console.log(`  ${s.status}: ${s.count}`);
});
```

---

## 🔄 Comparison: Old vs New API

### Old API (Separated)

```bash
# Bracket matches
GET /tournaments/:id/bracket

# Group matches
GET /tournaments/:id/groups/:gid
```

**Problems**:
- ❌ Phải gọi nhiều endpoints
- ❌ Format khác nhau (bracket format vs match format)
- ❌ Không thể filter toàn bộ matches
- ❌ Không có single match endpoint

---

### New API (Unified)

```bash
# All matches in one endpoint
GET /tournaments/:id/matches

# With flexible filtering
GET /tournaments/:id/matches?stage=FINAL
GET /tournaments/:id/matches?stage=GROUP&groupId=group-A

# Single match
GET /tournaments/:id/matches/:matchId

# Statistics
GET /tournaments/:id/matches/stats
```

**Benefits**:
- ✅ Một endpoint duy nhất
- ✅ Format thống nhất
- ✅ Filtering linh hoạt
- ✅ Pagination support
- ✅ Single match endpoint
- ✅ Statistics endpoint

---

## 📊 Data Format

### Match Object Structure

```typescript
interface MatchResponseDto {
  id: string;
  tournamentId: string;
  groupId: string | null;           // null = bracket, <id> = group
  stage: 'FINAL' | 'GROUP';         // Type of match
  round: number;                     // Round number
  matchNumber: number;               // Position in round
  bracketPosition: number | null;    // For bracket visualization
  matchDate: Date | null;
  courtNumber: string | null;
  status: MatchStatus;
  winnerId: string | null;
  finalScore: string | null;         // "3-1"
  gameScores: GameScore[] | null;    // Detailed set scores
  isPlacementMatch: boolean;         // 3rd place match?
  placementRank: number | null;
  createdAt: Date;
  updatedAt: Date;
  participants: MatchParticipant[];  // Empty = TBD
  group?: GroupInfo;                 // Only for GROUP stage
}
```

### Game Score Structure

```typescript
interface GameScore {
  game: number;           // Set number (1, 2, 3, ...)
  player1Score: number;   // Points scored by player 1
  player2Score: number;   // Points scored by player 2
  duration?: number;      // Duration in seconds
}
```

---

## 🎯 Frontend Integration Examples

### React Component: Match List

```typescript
import { useState, useEffect } from 'react';

function MatchList({ tournamentId, stage }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const query = stage ? `?stage=${stage}` : '';
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/matches${query}`
      );
      const { data } = await response.json();
      setMatches(data.data);
      setLoading(false);
    }
    loadMatches();
  }, [tournamentId, stage]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {matches.map(match => (
        <div key={match.id}>
          <h3>Round {match.round} - Match {match.matchNumber}</h3>
          <div>Stage: {match.stage}</div>
          <div>Status: {match.status}</div>
          {match.participants.length === 0 ? (
            <div>TBD vs TBD</div>
          ) : (
            <div>
              {match.participants.map(p => (
                <div key={p.id}>
                  {p.participant.user.displayName}
                  {p.isWinner && ' ✓'}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### Vue Component: Match Statistics

```vue
<template>
  <div>
    <h2>Match Statistics</h2>
    <div>Total: {{ stats.total }}</div>

    <h3>By Stage</h3>
    <ul>
      <li v-for="s in stats.byStage" :key="s.stage">
        {{ s.stage }}: {{ s.count }}
      </li>
    </ul>

    <h3>By Status</h3>
    <ul>
      <li v-for="s in stats.byStatus" :key="s.status">
        {{ s.status }}: {{ s.count }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps(['tournamentId']);
const stats = ref({ total: 0, byStage: [], byStatus: [] });

onMounted(async () => {
  const response = await fetch(
    `/api/admin/tournaments/${props.tournamentId}/matches/stats`
  );
  const { data } = await response.json();
  stats.value = data;
});
</script>
```

---

## 📚 Related Documentation

- [TOURNAMENT_ENDPOINTS_SUMMARY.md](./TOURNAMENT_ENDPOINTS_SUMMARY.md) - All tournament endpoints
- [DRAFT_MATCHES_API.md](./DRAFT_MATCHES_API.md) - Draft matches system
- [MATCH_FORMAT_GUIDE.md](./MATCH_FORMAT_GUIDE.md) - Match format configuration
- [TOURNAMENT_ARCHITECTURE.md](./TOURNAMENT_ARCHITECTURE.md) - System architecture

---

## ✅ Summary

**New Matches API provides:**
- ✅ Unified endpoint for all match types
- ✅ Flexible filtering (stage, group, status, round)
- ✅ Pagination support
- ✅ Single match detail endpoint
- ✅ Statistics endpoint
- ✅ Consistent data format
- ✅ Support for TBD placeholders
- ✅ Works with both SINGLE_STAGE and TWO_STAGES tournaments

**Use this API when you need:**
- Display all matches in one place
- Filter matches by various criteria
- Get detailed match information
- Show match statistics
- Build match management UI
