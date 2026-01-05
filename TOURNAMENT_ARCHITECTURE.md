# Tournament Architecture - Single Stage vs Two Stages

## Tổng quan cách quản lý

Tôi sử dụng **flexible schema** với các field chung và field tùy chọn để support cả Single Stage và Two Stages trong cùng một bảng `tournaments`.

---

## 1. Schema Design

### Tournament Table (Main)
```typescript
Tournament {
  id: string
  name: string
  gameType: "SINGLE_STAGE" | "TWO_STAGES"  // ← Key differentiator

  // Config stored as JSON (flexible)
  singleStageConfig: JSON?   // Only for SINGLE_STAGE
  twoStagesConfig: JSON?     // Only for TWO_STAGES

  // Relations
  participants: TournamentParticipant[]  // All participants
  groups: TournamentGroup[]              // Only for TWO_STAGES
  matches: TournamentMatch[]             // All matches
}
```

### TournamentMatch (Unified for both types)
```typescript
TournamentMatch {
  id: string
  tournamentId: string
  groupId: string?           // ← null = final stage, not-null = group stage

  stage: "GROUP" | "FINAL"   // ← Key field to differentiate
  round: int                 // Round number
  matchNumber: int           // Position in round

  // Match belongs to group (for GROUP stage) or tournament (for FINAL stage)
}
```

---

## 2. Cách hoạt động cho từng loại

### A. SINGLE STAGE Tournament

#### Flow:
```
Create Tournament (SINGLE_STAGE)
  ↓
Add Participants (no group assignment)
  ↓
Generate Bracket/Schedule
  ↓
  → Single Elimination: Generate bracket tree
  → Round Robin: Generate round-robin schedule
  ↓
All matches have:
  - stage = "FINAL"
  - groupId = null
```

#### Database State (Single Elimination Example):
```sql
-- Tournament
{
  id: "t1",
  gameType: "SINGLE_STAGE",
  singleStageConfig: {
    format: "SINGLE_ELIMINATION",
    singleEliminationConfig: { hasPlacementMatches: true }
  }
}

-- Participants (16 players)
{ id: "p1", tournamentId: "t1", userId: "u1", seed: 1, groupId: null }
{ id: "p2", tournamentId: "t1", userId: "u2", seed: 2, groupId: null }
...

-- Groups
(empty - không có groups)

-- Matches (15 matches cho 16 players single elim)
{ id: "m1", tournamentId: "t1", groupId: null, stage: "FINAL", round: 1, matchNumber: 1 }  // QF1
{ id: "m2", tournamentId: "t1", groupId: null, stage: "FINAL", round: 1, matchNumber: 2 }  // QF2
...
{ id: "m14", tournamentId: "t1", groupId: null, stage: "FINAL", round: 4, matchNumber: 1 } // Final
{ id: "m15", tournamentId: "t1", groupId: null, stage: "FINAL", round: 0, matchNumber: 1 } // 3rd place
```

**Key points:**
- `groupId = null` cho tất cả matches
- `stage = "FINAL"` cho tất cả matches
- Không có records trong `TournamentGroup`

---

### B. TWO STAGES Tournament

#### Flow:
```
Create Tournament (TWO_STAGES)
  ↓
Add Participants
  ↓
Generate Groups (e.g., 4 groups of 4 players)
  ↓
Generate Group Stage Matches
  ↓
  → Round Robin in each group
  ↓
Complete Group Stage
  ↓
Determine Qualifiers (top 2 from each group)
  ↓
Generate Final Stage Bracket (Single Elimination)
```

#### Database State Example (16 players, 4 groups, top 2 advance):

```sql
-- Tournament
{
  id: "t2",
  gameType: "TWO_STAGES",
  twoStagesConfig: {
    groupStage: {
      format: "ROUND_ROBIN",
      participantsPerGroup: 4,
      participantsAdvancing: 2,
      ...
    },
    finalStage: {
      format: "SINGLE_ELIMINATION",
      hasPlacementMatches: true
    }
  }
}

-- Groups (4 groups)
{ id: "g1", tournamentId: "t2", name: "A", displayName: "Group A" }
{ id: "g2", tournamentId: "t2", name: "B", displayName: "Group B" }
{ id: "g3", tournamentId: "t2", name: "C", displayName: "Group C" }
{ id: "g4", tournamentId: "t2", name: "D", displayName: "Group D" }

-- Participants (16 players assigned to groups)
{ id: "p1", tournamentId: "t2", userId: "u1", seed: 1, groupId: "g1" }  // Group A
{ id: "p2", tournamentId: "t2", userId: "u2", seed: 2, groupId: "g1" }  // Group A
{ id: "p3", tournamentId: "t2", userId: "u3", seed: 3, groupId: "g1" }  // Group A
{ id: "p4", tournamentId: "t2", userId: "u4", seed: 4, groupId: "g1" }  // Group A
{ id: "p5", tournamentId: "t2", userId: "u5", seed: 5, groupId: "g2" }  // Group B
...

-- Matches - GROUP STAGE (24 matches total: 6 per group × 4 groups)
{ id: "m1", tournamentId: "t2", groupId: "g1", stage: "GROUP", round: 1, matchNumber: 1 }  // A: p1 vs p2
{ id: "m2", tournamentId: "t2", groupId: "g1", stage: "GROUP", round: 1, matchNumber: 2 }  // A: p3 vs p4
{ id: "m3", tournamentId: "t2", groupId: "g1", stage: "GROUP", round: 2, matchNumber: 1 }  // A: p1 vs p3
...
{ id: "m24", tournamentId: "t2", groupId: "g4", stage: "GROUP", round: 3, matchNumber: 2 } // D: last match

-- Matches - FINAL STAGE (7 matches: 8 players single elim)
{ id: "m25", tournamentId: "t2", groupId: null, stage: "FINAL", round: 1, matchNumber: 1 } // QF1: Winner A vs Runner-up B
{ id: "m26", tournamentId: "t2", groupId: null, stage: "FINAL", round: 1, matchNumber: 2 } // QF2: Winner B vs Runner-up A
{ id: "m27", tournamentId: "t2", groupId: null, stage: "FINAL", round: 1, matchNumber: 3 } // QF3: Winner C vs Runner-up D
{ id: "m28", tournamentId: "t2", groupId: null, stage: "FINAL", round: 1, matchNumber: 4 } // QF4: Winner D vs Runner-up C
{ id: "m29", tournamentId: "t2", groupId: null, stage: "FINAL", round: 2, matchNumber: 1 } // SF1
{ id: "m30", tournamentId: "t2", groupId: null, stage: "FINAL", round: 2, matchNumber: 2 } // SF2
{ id: "m31", tournamentId: "t2", groupId: null, stage: "FINAL", round: 3, matchNumber: 1 } // Final
```

**Key points:**
- Group stage matches: `groupId != null`, `stage = "GROUP"`
- Final stage matches: `groupId = null`, `stage = "FINAL"`
- Participants có `groupId` để biết thuộc bảng nào

---

## 3. Queries để lấy dữ liệu

### Get Group Stage Matches
```typescript
// Lấy tất cả matches của group stage
const groupMatches = await prisma.tournamentMatch.findMany({
  where: {
    tournamentId: "t2",
    stage: "GROUP"
  },
  include: {
    group: true,
    participants: {
      include: {
        participant: {
          include: {
            user: true
          }
        }
      }
    }
  }
});
```

### Get Final Stage Matches
```typescript
// Lấy tất cả matches của final stage
const finalMatches = await prisma.tournamentMatch.findMany({
  where: {
    tournamentId: "t2",
    stage: "FINAL"
  },
  orderBy: [
    { round: 'asc' },
    { matchNumber: 'asc' }
  ]
});
```

### Get Matches of a Specific Group
```typescript
// Lấy matches của Group A
const groupAMatches = await prisma.tournamentMatch.findMany({
  where: {
    tournamentId: "t2",
    groupId: "g1",
    stage: "GROUP"
  }
});
```

### Get All Matches (Both Stages)
```typescript
// Lấy tất cả matches của tournament
const allMatches = await prisma.tournamentMatch.findMany({
  where: {
    tournamentId: "t2"
  },
  orderBy: [
    { stage: 'asc' },    // GROUP first, then FINAL
    { round: 'asc' },
    { matchNumber: 'asc' }
  ]
});
```

---

## 4. Ưu điểm của thiết kế này

### ✅ Flexible
- Một schema support cả 2 loại tournament
- Dễ mở rộng thêm các loại khác (triple elimination, swiss system, etc.)

### ✅ Clear Separation
- `stage` field giúp phân biệt rõ ràng GROUP vs FINAL
- `groupId` giúp link matches với groups

### ✅ Reusable Code
- Logic xử lý matches có thể reuse cho cả 2 stages
- Service layer có thể handle cả 2 types

### ✅ Query Efficiency
- Index trên `stage`, `groupId` giúp query nhanh
- Có thể filter matches theo stage dễ dàng

---

## 5. So sánh với cách khác

### ❌ Cách 1: Tách ra 2 bảng riêng
```
SingleStageTournament
TwoStageTournament
```
**Nhược điểm:**
- Code duplication
- Khó maintain
- Khó mở rộng thêm loại mới

### ❌ Cách 2: Tách matches thành 2 bảng
```
GroupStageMatch
FinalStageMatch
```
**Nhược điểm:**
- Logic phức tạp khi query tất cả matches
- Code duplication cho match handling
- Khó khi cần xem toàn bộ timeline của tournament

### ✅ Cách hiện tại: Unified với discriminator fields
```
Tournament (gameType: SINGLE_STAGE | TWO_STAGES)
TournamentMatch (stage: GROUP | FINAL, groupId: nullable)
```
**Ưu điểm:**
- Clean, maintainable
- Flexible, extensible
- Efficient queries

---

## 6. Workflow Implementation

### Single Stage Workflow
```typescript
// 1. Create tournament
const tournament = await createTournament({
  gameType: "SINGLE_STAGE",
  singleStageConfig: { ... }
});

// 2. Add participants
await addParticipants(tournament.id, userIds);
// participants.groupId = null

// 3. Generate bracket/schedule
await generateBracket(tournament.id);
// Creates matches with stage="FINAL", groupId=null

// 4. Update match results
await updateMatchResult(matchId, result);

// 5. Complete tournament
await completeTournament(tournament.id);
```

### Two Stages Workflow
```typescript
// 1. Create tournament
const tournament = await createTournament({
  gameType: "TWO_STAGES",
  twoStagesConfig: { ... }
});

// 2. Add participants
await addParticipants(tournament.id, userIds);
// participants.groupId = null initially

// 3. Generate groups
await generateGroups(tournament.id);
// Creates groups, assigns participants.groupId

// 4. Generate group stage matches
await generateGroupStageMatches(tournament.id);
// Creates matches with stage="GROUP", groupId=groupId

// 5. Complete group stage
await completeGroupStage(tournament.id);
// Determines qualifiers

// 6. Generate final stage bracket
await generateFinalStageBracket(tournament.id);
// Creates matches with stage="FINAL", groupId=null

// 7. Update match results
await updateMatchResult(matchId, result);

// 8. Complete tournament
await completeTournament(tournament.id);
```

---

## 7. Kết luận

Design này:
- ✅ **Linh hoạt**: Support cả Single Stage và Two Stages
- ✅ **Rõ ràng**: Dùng `stage` và `groupId` để phân biệt
- ✅ **Hiệu quả**: Query nhanh nhờ index
- ✅ **Dễ maintain**: Một codebase cho cả 2 loại
- ✅ **Dễ mở rộng**: Có thể thêm loại mới (3 stages, swiss, etc.)

**Câu hỏi của bạn có được giải đáp chưa?** Nếu bạn muốn tôi adjust design hoặc có cách nào khác bạn muốn thử, hãy cho tôi biết!
