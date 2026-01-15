# Tournament Admin API

## Muc tieu
Cac endpoint de quan tri giai dau, stage va stage rules cho Admin Portal.

## Auth
Tat ca endpoint yeu cau bearer token (admin).

## Base URL
`/api/admin`

## Tournament

### GET /tournaments
- Ai goi: Admin Portal
- Khi nao: xem danh sach giai dau
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `search` (string, >= 2 ky tu)
  - `orderBy` (createdAt | name)
  - `order` (asc | desc)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Giai dau 2025",
      "description": "...",
      "matchFormat": "SINGLE",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /tournaments
- Ai goi: Admin Portal
- Khi nao: tao giai dau moi
- Body:
```json
{
  "name": "Giai dau 2025",
  "description": "...",
  "matchFormat": "SINGLE"
}
```
- Response: tournament object

### GET /tournaments/{id}
- Ai goi: Admin Portal
- Khi nao: xem chi tiet giai dau
- Response: tournament object

### PATCH /tournaments/{id}
- Ai goi: Admin Portal
- Khi nao: cap nhat giai dau
- Body:
```json
{
  "name": "Giai dau cap nhat",
  "description": "...",
  "matchFormat": "DOUBLES"
}
```
- Response: tournament object

### DELETE /tournaments/{id}
- Ai goi: Admin Portal
- Khi nao: xoa giai dau (xoa vinh vien)
- Response:
```json
{ "success": true, "data": { "message": "Da xoa giai dau thanh cong" } }
```

## Stages

### GET /tournaments/{id}/stages
- Ai goi: Admin Portal
- Khi nao: xem danh sach stage cua giai dau
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `orderBy` (stageOrder | createdAt | name)
  - `order` (asc | desc)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "name": "Group Stage",
      "type": "GROUP",
      "stageOrder": 1,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /tournaments/{id}/stages
- Ai goi: Admin Portal
- Khi nao: tao stage cho giai dau
- Body:
```json
{
  "name": "Group Stage",
  "type": "GROUP",
  "stageOrder": 1
}
```
- Response: stage object

### GET /stages/{id}
- Ai goi: Admin Portal
- Khi nao: xem chi tiet stage
- Response: stage object

### PATCH /stages/{id}
- Ai goi: Admin Portal
- Khi nao: cap nhat stage
- Body:
```json
{
  "name": "Knockout",
  "type": "KNOCKOUT",
  "stageOrder": 2
}
```
- Response: stage object

### DELETE /stages/{id}
- Ai goi: Admin Portal
- Khi nao: xoa stage
- Response:
```json
{ "success": true, "data": { "message": "Da xoa stage thanh cong" } }
```

## Stage Rules

### GET /stages/{id}/rules
- Ai goi: Admin Portal
- Khi nao: xem stage rules
- Response: stage rule object

### POST /stages/{id}/rules
- Ai goi: Admin Portal
- Khi nao: tao stage rules
- Body:
```json
{
  "winPoints": 1,
  "lossPoints": 0,
  "byePoints": 1,
  "countByeGamesPoints": false,
  "countWalkoverAsPlayed": true,
  "tieBreakOrder": ["matchPoints", "h2h"],
  "h2hMode": "TWO_WAY_ONLY"
}
```
- Response: stage rule object

### PATCH /stages/{id}/rules
- Ai goi: Admin Portal
- Khi nao: cap nhat stage rules
- Body:
```json
{
  "tieBreakOrder": ["matchPoints", "gamesWon"],
  "h2hMode": "MINI_TABLE"
}
```
- Response: stage rule object

### DELETE /stages/{id}/rules
- Ai goi: Admin Portal
- Khi nao: xoa stage rules
- Response:
```json
{ "success": true, "data": { "message": "Da xoa stage rules thanh cong" } }
```

## Stage Rule Presets

### GET /stage-rule-presets
- Ai goi: Admin Portal
- Khi nao: xem danh sach preset
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `search` (string, >= 2 ky tu)
  - `isActive` (boolean)
  - `orderBy` (createdAt | name)
  - `order` (asc | desc)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "GROUP_DEFAULT",
      "name": "Group Default",
      "description": null,
      "winPoints": 1,
      "lossPoints": 0,
      "byePoints": 1,
      "countByeGamesPoints": false,
      "countWalkoverAsPlayed": true,
      "tieBreakOrder": ["matchPoints", "h2h"],
      "h2hMode": "TWO_WAY_ONLY",
      "qualifyMode": "TOP_N_PER_GROUP",
      "topNPerGroup": 2,
      "topNOverall": null,
      "wildcardCount": 0,
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /stage-rule-presets
- Ai goi: Admin Portal
- Khi nao: tao preset
- Body:
```json
{
  "code": "GROUP_DEFAULT",
  "name": "Group Default",
  "description": "Preset mac dinh",
  "winPoints": 1,
  "lossPoints": 0,
  "byePoints": 1,
  "countByeGamesPoints": false,
  "countWalkoverAsPlayed": true,
  "tieBreakOrder": ["matchPoints", "h2h"],
  "h2hMode": "TWO_WAY_ONLY",
  "qualifyMode": "TOP_N_PER_GROUP",
  "topNPerGroup": 2,
  "topNOverall": null,
  "wildcardCount": 0,
  "isActive": true
}
```
- Response: stage rule preset object

### GET /stage-rule-presets/{id}
- Ai goi: Admin Portal
- Khi nao: xem chi tiet preset
- Response: stage rule preset object

### PATCH /stage-rule-presets/{id}
- Ai goi: Admin Portal
- Khi nao: cap nhat preset
- Body:
```json
{
  "name": "Group Default Updated",
  "isActive": false
}
```
- Response: stage rule preset object

### DELETE /stage-rule-presets/{id}
- Ai goi: Admin Portal
- Khi nao: xoa preset
- Response:
```json
{ "success": true, "data": { "message": "Da xoa preset thanh cong" } }
```

## Tournament Participants

### GET /tournaments/{id}/participants
- Ai goi: Admin Portal
- Khi nao: xem danh sach participants cua giai dau
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `search` (string, >= 2 ky tu)
  - `status` (string)
  - `orderBy` (createdAt | displayName | seed)
  - `order` (asc | desc)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tournamentId": "uuid",
      "displayName": "Player 1",
      "seed": 1,
      "status": "active",
      "members": [
        {
          "userId": "user-id-1",
          "displayName": "User 1",
          "ratingPoints": 1200
        },
        {
          "userId": "user-id-2",
          "displayName": "User 2",
          "ratingPoints": 1180
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /tournaments/{id}/participants
- Ai goi: Admin Portal
- Khi nao: tao participant cho giai dau
- Luu y: neu tournament matchFormat = DOUBLES thi bat buoc `memberIds` gom 2 user
- Body:
```json
{
  "displayName": "Player 1",
  "memberIds": ["user-id-1", "user-id-2"],
  "seed": 1,
  "status": "active"
}
```
- Response: participant object

### GET /participants/{id}
- Ai goi: Admin Portal
- Khi nao: xem chi tiet participant
- Response: participant object

### PATCH /participants/{id}
- Ai goi: Admin Portal
- Khi nao: cap nhat participant
- Body:
```json
{
  "displayName": "Player 1 Updated",
  "memberIds": ["user-id-1", "user-id-3"],
  "seed": 2,
  "status": "inactive"
}
```
- Response: participant object

### DELETE /participants/{id}
- Ai goi: Admin Portal
- Khi nao: xoa participant
- Response:
```json
{ "success": true, "data": { "message": "Da xoa participant thanh cong" } }
```

### POST /tournaments/{id}/participants/seed
- Ai goi: Admin Portal
- Khi nao: cap nhat seed theo elo cho tat ca participants
- Body (optional):
```json
{
  "by": "elo"
}
```
- Response:
```json
{ "success": true, "data": { "success": true } }
```

## Groups

### GET /stages/{id}/groups
- Ai goi: Admin Portal
- Khi nao: xem danh sach groups cua stage
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `orderBy` (groupOrder | createdAt | name)
  - `order` (asc | desc)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "stageId": "uuid",
      "name": "Group A",
      "groupOrder": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /stages/{id}/groups
- Ai goi: Admin Portal
- Khi nao: tao group cho stage
- Body:
```json
{
  "name": "Group A",
  "groupOrder": 1
}
```
- Response: group object

### GET /groups/{id}
- Ai goi: Admin Portal
- Khi nao: xem chi tiet group
- Response: group object

### PATCH /groups/{id}
- Ai goi: Admin Portal
- Khi nao: cap nhat group
- Body:
```json
{
  "name": "Group A Updated",
  "groupOrder": 2
}
```
- Response: group object

### DELETE /groups/{id}
- Ai goi: Admin Portal
- Khi nao: xoa group
- Response:
```json
{ "success": true, "data": { "message": "Da xoa group thanh cong" } }
```

## Group Members

### GET /groups/{id}/members
- Ai goi: Admin Portal
- Khi nao: xem danh sach members cua group
- Query params:
  - `page` (number, default 1)
  - `limit` (number, default 20)
  - `search` (string, >= 2 ky tu)
  - `status` (string)
  - `orderBy` (createdAt | seedInGroup)
  - `order` (asc | desc)
- Response:
```json
{
  "success": true,
  "data": [
    {
      "groupId": "uuid",
      "tournamentParticipantId": "uuid",
      "seedInGroup": 1,
      "status": "active"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### POST /groups/{id}/members
- Ai goi: Admin Portal
- Khi nao: them participant vao group
- Body:
```json
{
  "tournamentParticipantId": "uuid",
  "seedInGroup": 1,
  "status": "active"
}
```
- Response: group member object

### PATCH /groups/{id}/members/{participantId}
- Ai goi: Admin Portal
- Khi nao: cap nhat group member
- Body:
```json
{
  "seedInGroup": 2,
  "status": "inactive"
}
```
- Response: group member object

### DELETE /groups/{id}/members/{participantId}
- Ai goi: Admin Portal
- Khi nao: xoa group member
- Response:
```json
{ "success": true, "data": { "message": "Da xoa group member thanh cong" } }
```

## Bracket (Knockout)

### POST /stages/{id}/bracket/generate
- Ai goi: Admin Portal
- Khi nao: tao bracket cho stage knockout
- Body (random):
```json
{
  "sourceType": "RANDOM",
  "size": 16,
  "seedOrder": "STANDARD",
  "bestOf": 1
}
```
- Body (custom pairs):
```json
{
  "sourceType": "CUSTOM",
  "pairs": [
    { "sideA": "p1", "sideB": "p2" },
    { "sideA": "p3", "sideB": "p4" }
  ],
  "bestOf": 1
}
```
- Body (group rank):
```json
{
  "sourceType": "GROUP_RANK",
  "sourceStageId": "stage-group-id",
  "topNPerGroup": 2,
  "wildcardCount": 0,
  "size": 8
}
```
- Response:
```json
{ "success": true, "data": { "message": "Da tao bracket thanh cong" } }
```

### GET /stages/{id}/bracket
- Ai goi: Admin Portal
- Khi nao: xem bracket
- Response:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match-id",
        "roundNo": 1,
        "matchNo": 1,
        "status": "SCHEDULED",
        "sides": [
          {
            "side": "A",
            "participants": [{ "id": "p1", "displayName": "Team 1" }]
          },
          {
            "side": "B",
            "participants": []
          }
        ]
      }
    ],
    "slots": [
      {
        "id": "slot-id",
        "targetMatchId": "match-id",
        "targetSide": "A",
        "sourceType": "GROUP_RANK",
        "sourceGroupId": "group-id",
        "sourceRank": 1,
        "resolved": true,
        "participant": { "id": "p1", "displayName": "Team 1" }
      },
      {
        "id": "slot-id-2",
        "targetMatchId": "match-id",
        "targetSide": "B",
        "sourceType": "GROUP_RANK",
        "sourceGroupId": "group-id",
        "sourceRank": 2,
        "resolved": false,
        "participant": null
      }
    ]
  }
}
```

### POST /stages/{id}/bracket/resolve
- Ai goi: Admin Portal
- Khi nao: resolve slot trong bracket khi co du ket qua
- Response:
```json
{ "success": true, "data": { "resolvedCount": 4 } }
```

## Draw (Boc tham)

### POST /draws
- Ai goi: Admin Portal
- Khi nao: tao phien boc tham
- Body (DOUBLES_PAIRING):
```json
{
  "tournamentId": "tournament-id",
  "type": "DOUBLES_PAIRING",
  "payload": {
    "memberPool": ["user-id-1", "user-id-2", "user-id-3", "user-id-4"]
  }
}
```
- Body (GROUP_ASSIGNMENT):
```json
{
  "tournamentId": "tournament-id",
  "stageId": "stage-group-id",
  "type": "GROUP_ASSIGNMENT",
  "payload": {
    "groupIds": ["group-a-id", "group-b-id"],
    "participantIds": ["p1", "p2", "p3", "p4"]
  }
}
```
- Body (KNOCKOUT_PAIRING):
```json
{
  "tournamentId": "tournament-id",
  "stageId": "stage-knockout-id",
  "type": "KNOCKOUT_PAIRING",
  "payload": {
    "participantIds": ["p1", "p2", "p3", "p4"]
  }
}
```
- Response: draw session object

### GET /draws
- Ai goi: Admin Portal
- Khi nao: xem danh sach phien boc tham
- Query params:
  - `tournamentId` (string)
  - `stageId` (string)
  - `type` (DOUBLES_PAIRING | GROUP_ASSIGNMENT | KNOCKOUT_PAIRING)
- Response: danh sach draw session

### GET /draws/{id}
- Ai goi: Admin Portal
- Khi nao: xem chi tiet phien boc tham
- Response: draw session object

### PATCH /draws/{id}
- Ai goi: Admin Portal
- Khi nao: cap nhat payload/result boc tham
- Body:
```json
{
  "payload": {
    "participantIds": ["p1", "p2"]
  },
  "result": {
    "pairs": [
      { "sideA": "p1", "sideB": "p2" }
    ]
  }
}
```
- Response: draw session object

### POST /draws/{id}/apply
- Ai goi: Admin Portal
- Khi nao: ap dung ket qua boc tham
- Ket qua:
  - DOUBLES_PAIRING: tao participants (team) tu pair
  - GROUP_ASSIGNMENT: tao GroupMember
  - KNOCKOUT_PAIRING: tao bracket + matches round 1
- Response:
```json
{ "success": true, "data": { "message": "Da ap dung boc tham" } }
```

### NOTE - Flow boc tham -> tao -> xem bracket (de FE integrate)
1) POST /api/admin/draws (tao phien boc tham)
2) PATCH /api/admin/draws/{id} (cap nhat result pairs/order/assignments tu boc tham offline)
3) POST /api/admin/draws/{id}/apply (tao bracket + matches round 1)
4) GET /api/admin/stages/{id}/bracket (lay matches + slots co resolved)

Neu muon bo qua draw, co the goi thang:
- POST /api/admin/stages/{id}/bracket/generate voi sourceType=CUSTOM va pairs
