# Tournament API Guide

## Tổng quan

API Tournament đã được implement với 5 endpoints cơ bản cho CRUD operations:

1. **POST** `/api/admin/tournaments` - Tạo tournament mới
2. **GET** `/api/admin/tournaments` - Lấy danh sách tournaments (có pagination & filters)
3. **GET** `/api/admin/tournaments/:id` - Lấy chi tiết tournament
4. **PATCH** `/api/admin/tournaments/:id` - Cập nhật tournament
5. **DELETE** `/api/admin/tournaments/:id` - Xóa tournament (soft delete)

---

## Authentication

Tất cả các endpoints đều yêu cầu admin authentication:

```
Authorization: Bearer <admin_token>
```

---

## 1. Create Tournament

### Endpoint
```
POST /api/admin/tournaments
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

### Request Body Examples

#### Example 1: Single Stage - Single Elimination
```json
{
  "name": "Championship 2026",
  "description": "Annual championship tournament",
  "game": "TABLE_TENNIS",
  "gameType": "SINGLE_STAGE",
  "registrationStartTime": "2026-01-15T10:00:00Z",
  "isTentative": false,
  "singleStageConfig": {
    "format": "SINGLE_ELIMINATION",
    "singleEliminationConfig": {
      "hasPlacementMatches": true
    }
  }
}
```

**Giải thích:**
- `hasPlacementMatches: true` → Có trận tranh hạng 3-4
- `hasPlacementMatches: false` → Đồng hạng 3 (không có trận tranh)

---

#### Example 2: Single Stage - Round Robin
```json
{
  "name": "Spring League 2026",
  "description": "Round robin league",
  "game": "TABLE_TENNIS",
  "gameType": "SINGLE_STAGE",
  "registrationStartTime": "2026-02-01T10:00:00Z",
  "isTentative": true,
  "singleStageConfig": {
    "format": "ROUND_ROBIN",
    "roundRobinConfig": {
      "matchupsPerPair": 1,
      "rankBy": "MATCH_WINS",
      "placementMethod": "PARTICIPANT_LIST_ORDER",
      "tieBreaks": [
        "WINS_VS_TIED",
        "GAME_SET_DIFFERENCE",
        "POINTS_DIFFERENCE"
      ]
    }
  }
}
```

**Giải thích:**
- `matchupsPerPair: 1` → Mỗi cặp thi đấu 1 lần
- `rankBy: "MATCH_WINS"` → Xếp hạng theo số trận thắng
- `placementMethod: "PARTICIPANT_LIST_ORDER"` → Xếp theo thứ tự danh sách
- `tieBreaks`: Quy tắc phá thế hòa
  - `WINS_VS_TIED`: Thắng trực tiếp
  - `GAME_SET_DIFFERENCE`: Hiệu số game/set
  - `POINTS_DIFFERENCE`: Hiệu số điểm

---

#### Example 3: Two Stages (Group + Final)
```json
{
  "name": "Summer Cup 2026",
  "description": "Tournament with group stage and knockout finals",
  "game": "TABLE_TENNIS",
  "gameType": "TWO_STAGES",
  "registrationStartTime": "2026-06-01T10:00:00Z",
  "isTentative": false,
  "twoStagesConfig": {
    "groupStage": {
      "format": "ROUND_ROBIN",
      "participantsPerGroup": 4,
      "participantsAdvancing": 2,
      "matchupsPerPair": 1,
      "rankBy": "MATCH_WINS",
      "placementMethod": "PARTICIPANT_LIST_ORDER",
      "tieBreaks": [
        "WINS_VS_TIED",
        "GAME_SET_DIFFERENCE",
        "POINTS_DIFFERENCE"
      ]
    },
    "finalStage": {
      "format": "SINGLE_ELIMINATION",
      "hasPlacementMatches": true
    }
  }
}
```

**Giải thích:**
- `participantsPerGroup: 4` → Mỗi bảng 4 người (max 20)
- `participantsAdvancing: 2` → 2 người vào vòng sau

---

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456",
    "name": "Championship 2026",
    "description": "Annual championship tournament",
    "game": "TABLE_TENNIS",
    "gameType": "SINGLE_STAGE",
    "status": "DRAFT",
    "registrationStartTime": "2026-01-15T10:00:00.000Z",
    "isTentative": false,
    "singleStageConfig": {
      "format": "SINGLE_ELIMINATION",
      "singleEliminationConfig": {
        "hasPlacementMatches": true
      }
    },
    "participantsLocked": false,
    "createdAt": "2026-01-04T10:00:00.000Z",
    "updatedAt": "2026-01-04T10:00:00.000Z",
    "participantsCount": 0,
    "matchesCount": 0
  }
}
```

---

## 2. Get All Tournaments

### Endpoint
```
GET /api/admin/tournaments
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| gameType | string | - | SINGLE_STAGE, TWO_STAGES |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| sortBy | string | createdAt | createdAt, updatedAt, name, registrationStartTime |
| sortOrder | string | desc | asc, desc |

### Examples

```bash
# Get all tournaments (page 1)
GET /api/admin/tournaments

# Get DRAFT tournaments
GET /api/admin/tournaments?status=DRAFT

# Get TWO_STAGES tournaments
GET /api/admin/tournaments?gameType=TWO_STAGES

# Pagination
GET /api/admin/tournaments?page=2&limit=10

# Sort by name ascending
GET /api/admin/tournaments?sortBy=name&sortOrder=asc
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "clx123abc456",
        "name": "Championship 2026",
        "status": "DRAFT",
        "gameType": "SINGLE_STAGE",
        ...
      }
    ],
    "meta": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
}
```

---

## 3. Get Tournament by ID

### Endpoint
```
GET /api/admin/tournaments/:id
```

### Example
```bash
GET /api/admin/tournaments/clx123abc456
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456",
    "name": "Championship 2026",
    "description": "Annual championship tournament",
    "game": "TABLE_TENNIS",
    "gameType": "SINGLE_STAGE",
    "status": "DRAFT",
    "singleStageConfig": { ... },
    "participantsCount": 16,
    "matchesCount": 15,
    "createdAt": "2026-01-04T10:00:00.000Z",
    "updatedAt": "2026-01-04T10:00:00.000Z"
  }
}
```

---

## 4. Update Tournament

### Endpoint
```
PATCH /api/admin/tournaments/:id
```

### Request Body
```json
{
  "name": "Championship 2026 - Updated",
  "description": "Updated description",
  "registrationStartTime": "2026-01-20T10:00:00Z",
  "isTentative": false
}
```

**Note:**
- Có thể update từng field riêng lẻ
- Không thể update tournament đã COMPLETED hoặc CANCELLED
- Có thể update config nếu cần

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456",
    "name": "Championship 2026 - Updated",
    "description": "Updated description",
    ...
  }
}
```

---

## 5. Delete Tournament

### Endpoint
```
DELETE /api/admin/tournaments/:id
```

### Example
```bash
DELETE /api/admin/tournaments/clx123abc456
```

### Response (Success - 200)
```json
{
  "success": true,
  "data": {
    "message": "Tournament deleted successfully"
  }
}
```

**Note:** Đây là soft delete, tournament không bị xóa khỏi database mà chỉ set `deletedAt` timestamp.

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Single stage config is required for SINGLE_STAGE tournament"
  }
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Missing or invalid authorization header"
  }
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Only admins can create tournaments"
  }
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": {
    "message": "Tournament not found"
  }
}
```

---

## Tournament Status Flow

```
DRAFT → PENDING → IN_PROGRESS → COMPLETED
  ↓
CANCELLED
```

- **DRAFT**: Mới tạo, đang chỉnh sửa
- **PENDING**: Đã publish, mở đăng ký
- **IN_PROGRESS**: Đang diễn ra
- **COMPLETED**: Đã kết thúc
- **CANCELLED**: Đã hủy

---

## Postman Collection

Import file `postman/Tournament_API.postman_collection.json` vào Postman để test.

### Setup
1. Import collection vào Postman
2. Set biến `baseUrl` = `http://localhost:3000`
3. Set biến `adminToken` = token của admin (sau khi login)
4. Test các requests

### Variables
- `baseUrl`: Base URL của API
- `adminToken`: Admin JWT token
- `tournamentId`: Auto-saved sau khi create tournament

---

## Database Schema

### Tournament Table
```sql
tournaments
├── id (cuid)
├── name
├── description
├── game (TABLE_TENNIS)
├── game_type (SINGLE_STAGE | TWO_STAGES)
├── status (DRAFT | PENDING | IN_PROGRESS | COMPLETED | CANCELLED)
├── registration_start_time
├── is_tentative
├── single_stage_config (JSONB)
├── two_stages_config (JSONB)
├── participants_locked
├── challonge_id
├── challonge_url
├── last_synced_at
├── created_at
├── updated_at
└── deleted_at
```

---

## Next Steps

Sau khi test xong các API CRUD này, bạn có thể tiếp tục implement:

1. **Participant Management APIs**
   - Add/Remove participants
   - Seed participants
   - Lock participants

2. **Group Management APIs** (for Two-Stage)
   - Generate groups
   - Get group standings

3. **Bracket/Schedule APIs**
   - Generate bracket
   - Get bracket structure

4. **Match Management APIs**
   - Update match results
   - Update match status
   - Reschedule matches

5. **Tournament Workflow APIs**
   - Publish tournament
   - Start tournament
   - Complete tournament
   - Cancel tournament

6. **Standings & Results APIs**
   - Get tournament standings
   - Export results

---

## Testing Checklist

- [ ] Create Single Stage - Single Elimination tournament
- [ ] Create Single Stage - Round Robin tournament
- [ ] Create Two Stages tournament
- [ ] Get all tournaments with pagination
- [ ] Filter tournaments by status
- [ ] Filter tournaments by gameType
- [ ] Get tournament by ID
- [ ] Update tournament name
- [ ] Update tournament config
- [ ] Delete tournament
- [ ] Verify soft delete (deletedAt is set)
- [ ] Test error cases (invalid config, missing auth, etc.)
