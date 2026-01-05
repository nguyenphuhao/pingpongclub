# Match Format Configuration Guide

## Overview

Match Format Configuration cho phép bạn định nghĩa số sets và điểm thắng cho từng loại trận đấu trong tournament. Điều này đặc biệt quan trọng cho bóng bàn, nơi mà các trận đấu có thể là Best of 3, Best of 5, hoặc Best of 7.

---

## Match Format Structure

```typescript
interface MatchFormat {
  bestOf: 3 | 5 | 7;           // Số sets tối đa
  pointsToWin: 11 | 21;        // Điểm cần để thắng mỗi set
  deuceRule: boolean;          // Áp dụng luật deuce (phải thắng cách 2 điểm từ 10-10)
  minLeadToWin: 2;             // Khoảng cách tối thiểu để thắng set
}
```

### Field Descriptions

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `bestOf` | number | 3, 5, 7 | Số sets tối đa trong trận. Người thắng là người thắng trước ⌈bestOf/2⌉ sets |
| `pointsToWin` | number | 11, 21 | Điểm cần để thắng mỗi set. Standard ITTF là 11 |
| `deuceRule` | boolean | true/false | Khi đạt 10-10 (hoặc 20-20), phải thắng cách 2 điểm |
| `minLeadToWin` | number | >= 1 | Khoảng cách tối thiểu để thắng (thường là 2) |

---

## Default Match Formats

Hệ thống cung cấp 3 match formats mặc định:

```typescript
import { DEFAULT_MATCH_FORMATS } from '@/server/modules/tournament/domain/tournament.types';

// Best of 3 - Standard format cho group stage
const bestOf3 = DEFAULT_MATCH_FORMATS.BEST_OF_3;
// {
//   bestOf: 3,
//   pointsToWin: 11,
//   deuceRule: true,
//   minLeadToWin: 2
// }

// Best of 5 - Standard format cho final stage
const bestOf5 = DEFAULT_MATCH_FORMATS.BEST_OF_5;
// {
//   bestOf: 5,
//   pointsToWin: 11,
//   deuceRule: true,
//   minLeadToWin: 2
// }

// Best of 7 - Extended format
const bestOf7 = DEFAULT_MATCH_FORMATS.BEST_OF_7;
// {
//   bestOf: 7,
//   pointsToWin: 11,
//   deuceRule: true,
//   minLeadToWin: 2
// }
```

---

## Configuration Examples

### Example 1: Single Stage Tournament (SINGLE_ELIMINATION)

**Use Case**: Giải đấu loại trực tiếp với best of 5

```json
{
  "name": "Championship 2026",
  "gameType": "SINGLE_STAGE",
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "matchFormat": {
      "bestOf": 5,
      "pointsToWin": 11,
      "deuceRule": true,
      "minLeadToWin": 2
    },
    "singleEliminationConfig": {
      "hasPlacementMatches": true
    }
  }
}
```

**Result**: Tất cả matches trong tournament sẽ là best of 5, first to win 3 sets.

---

### Example 2: Single Stage Tournament (ROUND_ROBIN)

**Use Case**: Giải đấu vòng tròn với best of 3

```json
{
  "name": "League 2026",
  "gameType": "SINGLE_STAGE",
  "singleStageConfig": {
    "format": "ROUND_ROBIN",
    "matchFormat": {
      "bestOf": 3,
      "pointsToWin": 11,
      "deuceRule": true,
      "minLeadToWin": 2
    },
    "roundRobinConfig": {
      "matchupsPerPair": 1,
      "rankBy": "MATCH_WINS",
      "placementMethod": "SEEDED",
      "tieBreaks": ["WINS_VS_TIED", "GAME_SET_DIFFERENCE"]
    }
  }
}
```

**Result**: Tất cả matches là best of 3, first to win 2 sets.

---

### Example 3: Two Stages Tournament (Different Formats)

**Use Case**: Group stage với best of 3, Final stage với best of 5

```json
{
  "name": "World Championship 2026",
  "gameType": "TWO_STAGES",
  "twoStagesConfig": {
    "groupStage": {
      "format": "ROUND_ROBIN",
      "matchFormat": {
        "bestOf": 3,
        "pointsToWin": 11,
        "deuceRule": true,
        "minLeadToWin": 2
      },
      "participantsPerGroup": 4,
      "participantsAdvancing": 2,
      "matchupsPerPair": 1,
      "rankBy": "MATCH_WINS",
      "placementMethod": "SEEDED",
      "tieBreaks": ["WINS_VS_TIED", "GAME_SET_DIFFERENCE"]
    },
    "finalStage": {
      "format": "SINGLE_ELIMINATION",
      "matchFormat": {
        "bestOf": 5,
        "pointsToWin": 11,
        "deuceRule": true,
        "minLeadToWin": 2
      },
      "hasPlacementMatches": true
    }
  }
}
```

**Result**:
- Group stage matches: Best of 3 (nhanh hơn)
- Final stage matches: Best of 5 (quan trọng hơn)

---

### Example 4: Old School Format (21 Points)

**Use Case**: Sử dụng format cũ với 21 điểm mỗi set

```json
{
  "name": "Veterans Cup 2026",
  "gameType": "SINGLE_STAGE",
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "matchFormat": {
      "bestOf": 5,
      "pointsToWin": 21,
      "deuceRule": true,
      "minLeadToWin": 2
    },
    "singleEliminationConfig": {
      "hasPlacementMatches": false
    }
  }
}
```

**Result**: Matches với 21 điểm mỗi set (pre-2001 ITTF rules).

---

## API Usage

### Create Tournament with Match Format

```bash
POST /api/admin/tournaments
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "Spring Championship 2026",
  "description": "Best of 5 format",
  "gameType": "SINGLE_STAGE",
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "matchFormat": {
      "bestOf": 5,
      "pointsToWin": 11,
      "deuceRule": true,
      "minLeadToWin": 2
    },
    "singleEliminationConfig": {
      "hasPlacementMatches": true
    }
  }
}
```

### Update Tournament Match Format

```bash
PATCH /api/admin/tournaments/:id
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "matchFormat": {
      "bestOf": 7,
      "pointsToWin": 11,
      "deuceRule": true,
      "minLeadToWin": 2
    },
    "singleEliminationConfig": {
      "hasPlacementMatches": true
    }
  }
}
```

**Note**: Chỉ có thể update match format khi tournament ở trạng thái DRAFT hoặc PENDING.

---

## Validation Rules

### Required Fields

✅ Tất cả fields trong `MatchFormat` đều bắt buộc:
- `bestOf` (3, 5, hoặc 7)
- `pointsToWin` (11 hoặc 21)
- `deuceRule` (boolean)
- `minLeadToWin` (>= 1)

### Validation Errors

| Error | Message |
|-------|---------|
| Missing matchFormat | "Cấu hình định dạng trận đấu là bắt buộc" |
| Invalid bestOf | "bestOf phải là 3, 5 hoặc 7" |
| Invalid pointsToWin | "pointsToWin phải là 11 hoặc 21" |
| Invalid deuceRule | "deuceRule phải là boolean" |
| Invalid minLeadToWin | "minLeadToWin phải lớn hơn 0" |

### Example Validation Error Response

```json
{
  "success": false,
  "error": {
    "message": "bestOf phải là 3, 5 hoặc 7",
    "code": "VALIDATION_ERROR"
  }
}
```

---

## Match Format in Practice

### How Match Format Affects Scoring

Khi submit score cho một match, hệ thống sẽ validate dựa trên `matchFormat`:

**Example with Best of 5:**
```json
{
  "matchFormat": { "bestOf": 5, "pointsToWin": 11, "deuceRule": true, "minLeadToWin": 2 },
  "gameScores": [
    { "game": 1, "player1Score": 11, "player2Score": 9 },   // Player 1 wins set 1
    { "game": 2, "player1Score": 9,  "player2Score": 11 },  // Player 2 wins set 2
    { "game": 3, "player1Score": 11, "player2Score": 7 },   // Player 1 wins set 3
    { "game": 4, "player1Score": 11, "player2Score": 9 },   // Player 1 wins set 4
    // Player 1 wins 3-1, no need for set 5
  ],
  "finalScore": "3-1",
  "winnerId": "player1-id"
}
```

### Deuce Rule Example

**With deuceRule: true, pointsToWin: 11:**
- Normal: First to 11 points wins
- At 10-10: Must win by 2 (12-10, 13-11, 14-12, etc.)

```json
{
  "game": 1,
  "player1Score": 13,
  "player2Score": 11
  // Valid: 13-11 (won by 2 after deuce)
}
```

---

## Common Match Format Scenarios

### Scenario 1: Club Tournament (Quick Matches)

**Goal**: Nhanh, nhiều trận trong ngày

```json
{
  "bestOf": 3,
  "pointsToWin": 11,
  "deuceRule": true,
  "minLeadToWin": 2
}
```

**Why**: Best of 3 giúp matches kết thúc nhanh (10-15 phút/match).

---

### Scenario 2: Championship Final (Decisive)

**Goal**: Tìm ra người chơi tốt nhất, giảm may rủi

```json
{
  "bestOf": 7,
  "pointsToWin": 11,
  "deuceRule": true,
  "minLeadToWin": 2
}
```

**Why**: Best of 7 cho phép người chơi tốt hơn thể hiện (30-50 phút/match).

---

### Scenario 3: Progressive Format

**Goal**: Group stage nhanh, finals quan trọng hơn

**Group Stage:**
```json
{
  "bestOf": 3,
  "pointsToWin": 11,
  "deuceRule": true,
  "minLeadToWin": 2
}
```

**Final Stage:**
```json
{
  "bestOf": 5,
  "pointsToWin": 11,
  "deuceRule": true,
  "minLeadToWin": 2
}
```

**Why**: Balance giữa thời gian và tính competitive.

---

## Frontend Integration

### Display Match Format to Users

```typescript
function displayMatchFormat(format: MatchFormat): string {
  const { bestOf, pointsToWin, deuceRule } = format;

  const setsToWin = Math.ceil(bestOf / 2);
  const deuceText = deuceRule ? ' (deuce rules apply)' : '';

  return `Best of ${bestOf} (first to ${setsToWin} sets), ${pointsToWin} points per set${deuceText}`;
}

// Output: "Best of 5 (first to 3 sets), 11 points per set (deuce rules apply)"
```

### Validate Score Submission

```typescript
function validateSetScore(
  player1Score: number,
  player2Score: number,
  matchFormat: MatchFormat
): boolean {
  const { pointsToWin, deuceRule, minLeadToWin } = matchFormat;

  // Someone must reach pointsToWin
  if (player1Score < pointsToWin && player2Score < pointsToWin) {
    return false;
  }

  // Check deuce rule
  if (deuceRule) {
    const maxScore = Math.max(player1Score, player2Score);
    const minScore = Math.min(player1Score, player2Score);

    // If scores >= pointsToWin-1, must win by minLeadToWin
    if (minScore >= pointsToWin - 1) {
      return maxScore - minScore >= minLeadToWin;
    }
  }

  // One player must reach pointsToWin and lead by at least minLeadToWin
  const lead = Math.abs(player1Score - player2Score);
  return lead >= minLeadToWin && (player1Score >= pointsToWin || player2Score >= pointsToWin);
}

// Examples:
validateSetScore(11, 9, bestOf5Format);   // true
validateSetScore(11, 10, bestOf5Format);  // false (deuce, need 12-10)
validateSetScore(12, 10, bestOf5Format);  // true (won by 2 after deuce)
validateSetScore(10, 8, bestOf5Format);   // false (neither reached 11)
```

---

## Migration Guide

### Updating Existing Tournaments

Các tournaments được tạo trước khi có match format sẽ:
- ❌ Không có `matchFormat` field trong config
- ⚠️ Cần được update để thêm match format

**Migration Script Example:**

```typescript
// Add default match format to existing tournaments
async function migrateExistingTournaments() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      OR: [
        { singleStageConfig: { not: Prisma.JsonNull } },
        { twoStagesConfig: { not: Prisma.JsonNull } },
      ],
    },
  });

  for (const tournament of tournaments) {
    let updated = false;

    // Update single stage
    if (tournament.singleStageConfig) {
      const config = tournament.singleStageConfig as any;
      if (!config.matchFormat) {
        config.matchFormat = DEFAULT_MATCH_FORMATS.BEST_OF_3;
        updated = true;
      }
    }

    // Update two stages
    if (tournament.twoStagesConfig) {
      const config = tournament.twoStagesConfig as any;
      if (!config.groupStage.matchFormat) {
        config.groupStage.matchFormat = DEFAULT_MATCH_FORMATS.BEST_OF_3;
        updated = true;
      }
      if (!config.finalStage.matchFormat) {
        config.finalStage.matchFormat = DEFAULT_MATCH_FORMATS.BEST_OF_5;
        updated = true;
      }
    }

    if (updated) {
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: {
          singleStageConfig: tournament.singleStageConfig,
          twoStagesConfig: tournament.twoStagesConfig,
        },
      });
    }
  }
}
```

---

## Related Documentation

- [TOURNAMENT_API.md](./TOURNAMENT_API.md) - Complete API reference
- [TOURNAMENT_ARCHITECTURE.md](./TOURNAMENT_ARCHITECTURE.md) - System architecture
- [DRAFT_MATCHES_API.md](./DRAFT_MATCHES_API.md) - Draft matches system

---

## Future Enhancements

### Planned Features

1. **Timeout Configuration**: Thời gian timeout giữa các sets
2. **Service Rules**: Luật đổi giao bóng (mỗi 2 điểm hoặc 5 điểm)
3. **Tiebreak Sets**: Set quyết định có điểm khác (ví dụ: first to 7)
4. **Handicap System**: Điểm khởi đầu khác nhau cho players
5. **Video Review**: Tích hợp video replay requirements

### API Endpoints (Coming Soon)

- `POST /api/admin/tournaments/:id/matches/:matchId/score` - Submit match score
- `PATCH /api/admin/tournaments/:id/matches/:matchId/score` - Update match score
- `DELETE /api/admin/tournaments/:id/matches/:matchId/score` - Reset match score
- `GET /api/admin/tournaments/:id/matches/:matchId/score/validate` - Validate score before submit

---

## Support

Nếu bạn gặp vấn đề với match format configuration:
1. Kiểm tra validation errors trong API response
2. Xem [TOURNAMENT_API.md](./TOURNAMENT_API.md) để biết API structure
3. Xem examples trong document này
4. Báo lỗi tại GitHub Issues
