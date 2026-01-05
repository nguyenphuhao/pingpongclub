# Match Format Implementation Summary

## ✅ Implementation Complete

Match Format Configuration đã được implement thành công cho tournament system, hỗ trợ Best of 3, Best of 5, và Best of 7 cho cả single stage và two stages tournaments.

---

## 📋 Changes Made

### 1. Type Definitions ([tournament.types.ts](apps/api-server/src/server/modules/tournament/domain/tournament.types.ts))

**Added:**
- `MatchFormat` interface (lines 26-31)
- `DEFAULT_MATCH_FORMATS` constants (lines 34-53)

**Updated:**
- `SingleStageConfig` - Added `matchFormat: MatchFormat` field (line 74)
- `GroupStageConfig` - Added `matchFormat: MatchFormat` field (line 81)
- `FinalStageConfig` - Added `matchFormat: MatchFormat` field (line 92)

**Code:**
```typescript
export interface MatchFormat {
  bestOf: 3 | 5 | 7;
  pointsToWin: 11 | 21;
  deuceRule: boolean;
  minLeadToWin: 2;
}

export const DEFAULT_MATCH_FORMATS = {
  BEST_OF_3: { bestOf: 3, pointsToWin: 11, deuceRule: true, minLeadToWin: 2 },
  BEST_OF_5: { bestOf: 5, pointsToWin: 11, deuceRule: true, minLeadToWin: 2 },
  BEST_OF_7: { bestOf: 7, pointsToWin: 11, deuceRule: true, minLeadToWin: 2 },
};
```

---

### 2. Validation Logic ([tournament.service.ts](apps/api-server/src/server/modules/tournament/application/tournament.service.ts))

**Added:**
- `validateMatchFormat()` private method (lines 331-347)

**Updated:**
- `validateTournamentConfig()` - Added match format validation for single stage (lines 284-288)
- `validateTournamentConfig()` - Added match format validation for two stages (lines 309-318)

**Validation Rules:**
- ✅ `bestOf` must be 3, 5, or 7
- ✅ `pointsToWin` must be 11 or 21
- ✅ `deuceRule` must be boolean
- ✅ `minLeadToWin` must be > 0

---

### 3. Documentation

**Created:**
- [MATCH_FORMAT_GUIDE.md](MATCH_FORMAT_GUIDE.md) - Comprehensive guide with:
  - MatchFormat structure explanation
  - Default format constants
  - Configuration examples for all tournament types
  - API usage examples
  - Validation rules
  - Frontend integration code
  - Migration guide for existing tournaments
  - Common scenarios and best practices

---

## 🎯 Features

### Supported Match Formats

| Format | bestOf | Sets to Win | Typical Use Case |
|--------|--------|-------------|------------------|
| Best of 3 | 3 | 2 | Group stage, club tournaments |
| Best of 5 | 5 | 3 | Finals, championships |
| Best of 7 | 7 | 4 | Grand finals, extended format |

### Points per Set

- **11 points** - Standard ITTF rules (post-2001)
- **21 points** - Old rules (pre-2001), veterans tournaments

### Deuce Rule

- When enabled and score reaches (pointsToWin-1) vs (pointsToWin-1):
  - Must win by at least `minLeadToWin` points (usually 2)
  - Example: 10-10 → must reach 12-10, 13-11, etc.

---

## 📊 Configuration Examples

### Single Stage - Best of 5

```json
{
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

### Two Stages - Progressive Format

```json
{
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

---

## 🔧 API Changes

### Create Tournament - Now Requires matchFormat

**Before:**
```json
{
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "singleEliminationConfig": { "hasPlacementMatches": true }
  }
}
```

**After (Required):**
```json
{
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "matchFormat": {
      "bestOf": 5,
      "pointsToWin": 11,
      "deuceRule": true,
      "minLeadToWin": 2
    },
    "singleEliminationConfig": { "hasPlacementMatches": true }
  }
}
```

### Validation Errors

| Error | Vietnamese Message |
|-------|-------------------|
| Missing matchFormat | "Cấu hình định dạng trận đấu là bắt buộc" |
| Missing for group stage | "Cấu hình định dạng trận đấu cho vòng bảng là bắt buộc" |
| Missing for final stage | "Cấu hình định dạng trận đấu cho vòng chung kết là bắt buộc" |
| Invalid bestOf | "bestOf phải là 3, 5 hoặc 7" |
| Invalid pointsToWin | "pointsToWin phải là 11 hoặc 21" |
| Invalid deuceRule | "deuceRule phải là boolean" |
| Invalid minLeadToWin | "minLeadToWin phải lớn hơn 0" |

---

## 💾 Database Storage

Match format is stored as part of the tournament configuration JSON:

- **SINGLE_STAGE**: `singleStageConfig.matchFormat`
- **TWO_STAGES**:
  - `twoStagesConfig.groupStage.matchFormat`
  - `twoStagesConfig.finalStage.matchFormat`

**No schema migration required** - config fields are already JSON type.

---

## 🧪 Testing Recommendations

### Unit Tests

```typescript
describe('MatchFormat Validation', () => {
  it('should accept valid best of 3 format', () => {
    const format = { bestOf: 3, pointsToWin: 11, deuceRule: true, minLeadToWin: 2 };
    expect(() => validateMatchFormat(format)).not.toThrow();
  });

  it('should reject invalid bestOf values', () => {
    const format = { bestOf: 4, pointsToWin: 11, deuceRule: true, minLeadToWin: 2 };
    expect(() => validateMatchFormat(format)).toThrow('bestOf phải là 3, 5 hoặc 7');
  });

  it('should reject invalid pointsToWin', () => {
    const format = { bestOf: 3, pointsToWin: 15, deuceRule: true, minLeadToWin: 2 };
    expect(() => validateMatchFormat(format)).toThrow('pointsToWin phải là 11 hoặc 21');
  });
});
```

### Integration Tests

```bash
# Test 1: Create tournament with best of 3
curl -X POST http://localhost:3000/api/admin/tournaments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tournament",
    "gameType": "SINGLE_STAGE",
    "singleStageConfig": {
      "format": "SINGLE_ELIMINATION",
      "matchFormat": {
        "bestOf": 3,
        "pointsToWin": 11,
        "deuceRule": true,
        "minLeadToWin": 2
      },
      "singleEliminationConfig": {
        "hasPlacementMatches": true
      }
    }
  }'

# Test 2: Create two-stage tournament with different formats
curl -X POST http://localhost:3000/api/admin/tournaments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Championship",
    "gameType": "TWO_STAGES",
    "twoStagesConfig": {
      "groupStage": {
        "format": "ROUND_ROBIN",
        "matchFormat": { "bestOf": 3, "pointsToWin": 11, "deuceRule": true, "minLeadToWin": 2 },
        "participantsPerGroup": 4,
        "participantsAdvancing": 2,
        "matchupsPerPair": 1,
        "rankBy": "MATCH_WINS",
        "placementMethod": "SEEDED",
        "tieBreaks": ["WINS_VS_TIED"]
      },
      "finalStage": {
        "format": "SINGLE_ELIMINATION",
        "matchFormat": { "bestOf": 5, "pointsToWin": 11, "deuceRule": true, "minLeadToWin": 2 },
        "hasPlacementMatches": true
      }
    }
  }'

# Test 3: Invalid format should fail
curl -X POST http://localhost:3000/api/admin/tournaments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid",
    "gameType": "SINGLE_STAGE",
    "singleStageConfig": {
      "format": "SINGLE_ELIMINATION",
      "matchFormat": {
        "bestOf": 4,
        "pointsToWin": 11,
        "deuceRule": true,
        "minLeadToWin": 2
      },
      "singleEliminationConfig": {
        "hasPlacementMatches": true
      }
    }
  }'
# Expected: 400 Bad Request with "bestOf phải là 3, 5 hoặc 7"
```

---

## 🚀 Next Steps

### Immediate (Required for Score Submission)

1. **Create Score Submission API**
   - `POST /api/admin/tournaments/:id/matches/:matchId/score`
   - Validate scores against matchFormat
   - Store gameScores array in match record
   - Update winnerId and finalScore

2. **Score Validation Service**
   - Validate each set score against pointsToWin
   - Check deuce rule compliance
   - Verify minimum lead requirement
   - Ensure correct number of sets (≤ bestOf)
   - Validate winner determination

3. **Match State Transitions**
   - `SCHEDULED` → `IN_PROGRESS` (on match start)
   - `IN_PROGRESS` → `COMPLETED` (on score submission)
   - Update tournament/group standings automatically

### Future Enhancements

1. **Live Score Updates**
   - WebSocket integration for real-time score updates
   - Set-by-set progress tracking
   - Current set in progress indicator

2. **Statistics & Analytics**
   - Average match duration per format
   - Set distribution analysis (3-0, 3-1, 3-2 for best of 5)
   - Player performance by format

3. **Advanced Features**
   - Timeout tracking
   - Service rotation rules
   - Video review integration
   - Challenge system

---

## 📚 Related Documentation

- [MATCH_FORMAT_GUIDE.md](MATCH_FORMAT_GUIDE.md) - Complete guide with examples
- [TOURNAMENT_API.md](TOURNAMENT_API.md) - API reference
- [TOURNAMENT_ARCHITECTURE.md](TOURNAMENT_ARCHITECTURE.md) - System architecture
- [DRAFT_MATCHES_API.md](DRAFT_MATCHES_API.md) - Draft matches system

---

## ✅ Backward Compatibility

### For New Tournaments

- ✅ `matchFormat` is **required** for all new tournaments
- ✅ Validation enforced at creation and update

### For Existing Tournaments

- ⚠️ Existing tournaments created before this feature do NOT have `matchFormat`
- ⚠️ Need migration to add default formats
- ℹ️ See [MATCH_FORMAT_GUIDE.md](MATCH_FORMAT_GUIDE.md) Migration Guide section

**Recommendation**: Run migration script to add default formats to existing tournaments:
- Single stage: Default to BEST_OF_3
- Group stage: Default to BEST_OF_3
- Final stage: Default to BEST_OF_5

---

## 🎉 Summary

Match Format Configuration is now fully integrated into the tournament system:

✅ **Types**: MatchFormat interface with validation
✅ **Defaults**: 3 pre-configured formats (Best of 3, 5, 7)
✅ **Validation**: Complete validation in tournament service
✅ **Flexibility**: Different formats for group vs final stages
✅ **Documentation**: Comprehensive guide with examples
✅ **TypeScript**: Full type safety, no compilation errors

**Status**: Ready for use in tournament creation and management!

**Next**: Implement score submission API to leverage match format configuration.
