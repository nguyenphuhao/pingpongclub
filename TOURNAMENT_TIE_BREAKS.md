# Tournament Tie Breaks - Cơ chế phá thế hòa

## 1. Tổng quan

Tie breaks được dùng trong **Round Robin** để xác định thứ hạng khi nhiều players có cùng số điểm/thắng.

### Use Cases:
1. **Single Stage - Round Robin**: Xếp hạng cuối cùng
2. **Two Stages - Group Stage**: Xác định ai advance vào Final Stage

---

## 2. Tie Break Rules (theo thứ tự ưu tiên)

### Cấu hình mặc định:
```json
{
  "tieBreaks": [
    "WINS_VS_TIED",           // #1: Thắng trực tiếp
    "GAME_SET_DIFFERENCE",    // #2: Hiệu số game/set
    "POINTS_DIFFERENCE"       // #3: Hiệu số điểm
  ]
}
```

### Rule #1: WINS_VS_TIED (Thắng trực tiếp)
**Ví dụ:** 3 players cùng 2-1 (2 thắng, 1 thua)

| Player | Record | vs A | vs B | vs C | H2H Record |
|--------|--------|------|------|------|------------|
| A      | 2-1    | -    | W    | W    | 2-0 → **#1** |
| B      | 2-1    | L    | -    | W    | 1-1 → **#2** |
| C      | 2-1    | L    | L    | -    | 0-2 → **#3** |

**Logic:**
```typescript
// So sánh kết quả đối đầu trực tiếp giữa các players hòa điểm
function winsVsTied(players: Player[], matches: Match[]): Player[] {
  const h2hResults = {};

  // Lấy tất cả matches giữa các players đang hòa
  for (const match of matches) {
    if (isBetweenTiedPlayers(match, players)) {
      const winner = match.winnerId;
      h2hResults[winner] = (h2hResults[winner] || 0) + 1;
    }
  }

  // Sort theo số thắng trong head-to-head
  return players.sort((a, b) =>
    (h2hResults[b.id] || 0) - (h2hResults[a.id] || 0)
  );
}
```

---

### Rule #2: GAME_SET_DIFFERENCE (Hiệu số game/set)

**Ví dụ:** Nếu rule #1 vẫn hòa, xem hiệu số games

| Player | Record | Games Won | Games Lost | Difference |
|--------|--------|-----------|------------|------------|
| A      | 2-1    | 6         | 3          | +3 → **#1** |
| B      | 2-1    | 5         | 4          | +1 → **#2** |
| C      | 2-1    | 4         | 5          | -1 → **#3** |

**Cách tính:**
- Match A vs B: 3-1 (A thắng 3 games, B thắng 1 game)
- Match A vs C: 3-2 (A thắng 3 games, C thắng 2 games)
- Match B vs C: 3-1 (B thắng 3 games, C thắng 1 game)

**Player A:** (3+3) - (1+2) = 6 - 3 = **+3**

**Logic:**
```typescript
function gameSetDifference(players: Player[], matches: Match[]): Player[] {
  const gameDiff = {};

  for (const player of players) {
    let gamesWon = 0;
    let gamesLost = 0;

    // Lấy tất cả matches của player
    const playerMatches = matches.filter(m =>
      m.participants.some(p => p.participantId === player.id)
    );

    for (const match of playerMatches) {
      const playerParticipant = match.participants.find(
        p => p.participantId === player.id
      );

      // Parse gameScores
      // Example: [{ game: 1, player1Score: 11, player2Score: 9 }, ...]
      const gameScores = match.gameScores as GameScore[];

      for (const game of gameScores) {
        if (playerParticipant.position === 1) {
          if (game.player1Score > game.player2Score) gamesWon++;
          else gamesLost++;
        } else {
          if (game.player2Score > game.player1Score) gamesWon++;
          else gamesLost++;
        }
      }
    }

    gameDiff[player.id] = gamesWon - gamesLost;
  }

  return players.sort((a, b) => gameDiff[b.id] - gameDiff[a.id]);
}
```

---

### Rule #3: POINTS_DIFFERENCE (Hiệu số điểm)

**Ví dụ:** Nếu vẫn hòa sau rule #2

| Player | Games | Points For | Points Against | Difference |
|--------|-------|------------|----------------|------------|
| A      | 5-4   | 104        | 98             | +6 → **#1** |
| B      | 5-4   | 101        | 99             | +2 → **#2** |
| C      | 5-4   | 99         | 103            | -4 → **#3** |

**Cách tính:**
- Tổng điểm player ghi được trong TẤT CẢ games
- Tổng điểm bị đối thủ ghi
- Difference = Points For - Points Against

**Logic:**
```typescript
function pointsDifference(players: Player[], matches: Match[]): Player[] {
  const pointsDiff = {};

  for (const player of players) {
    let pointsFor = 0;
    let pointsAgainst = 0;

    const playerMatches = matches.filter(m =>
      m.participants.some(p => p.participantId === player.id)
    );

    for (const match of playerMatches) {
      const playerParticipant = match.participants.find(
        p => p.participantId === player.id
      );

      const gameScores = match.gameScores as GameScore[];

      for (const game of gameScores) {
        if (playerParticipant.position === 1) {
          pointsFor += game.player1Score;
          pointsAgainst += game.player2Score;
        } else {
          pointsFor += game.player2Score;
          pointsAgainst += game.player1Score;
        }
      }
    }

    pointsDiff[player.id] = pointsFor - pointsAgainst;
  }

  return players.sort((a, b) => pointsDiff[b.id] - pointsDiff[a.id]);
}
```

---

## 3. Data Structure cho Game Scores

### Match.gameScores format (JSON):
```typescript
interface GameScore {
  game: number;        // Game number (1, 2, 3, ...)
  player1Score: number; // Player at position 1
  player2Score: number; // Player at position 2
  duration?: number;   // Optional: seconds
}

// Example match: Best of 5, A vs B (A wins 3-2)
{
  "gameScores": [
    { "game": 1, "player1Score": 11, "player2Score": 9 },   // A wins
    { "game": 2, "player1Score": 11, "player2Score": 7 },   // A wins
    { "game": 3, "player1Score": 9, "player2Score": 11 },   // B wins
    { "game": 4, "player1Score": 8, "player2Score": 11 },   // B wins
    { "game": 5, "player1Score": 11, "player2Score": 6 }    // A wins
  ],
  "finalScore": "3-2",
  "winnerId": "playerA_id"
}
```

### TournamentMatchParticipant:
```typescript
{
  id: "tmp1",
  matchId: "m1",
  participantId: "p1",
  position: 1,        // Player 1 or Player 2
  isWinner: true,
  score: "3-2"       // Games won
}
```

---

## 4. Complete Tie Break Service

```typescript
// apps/api-server/src/server/modules/tournament/application/tie-break.service.ts

import { TieBreak } from '../domain/tournament.types';

interface Player {
  id: string;
  userId: string;
  matchRecord: { wins: number; losses: number };
}

interface Match {
  id: string;
  winnerId: string;
  gameScores: GameScore[];
  participants: MatchParticipant[];
}

interface GameScore {
  game: number;
  player1Score: number;
  player2Score: number;
}

interface MatchParticipant {
  participantId: string;
  position: number;
  isWinner: boolean;
}

export class TieBreakService {
  /**
   * Apply tie break rules to determine standings
   */
  applyTieBreaks(
    players: Player[],
    matches: Match[],
    tieBreakRules: TieBreak[]
  ): Player[] {
    // Group players by match record
    const groups = this.groupByRecord(players);

    let result: Player[] = [];

    for (const group of groups) {
      if (group.length === 1) {
        // No tie, add directly
        result.push(group[0]);
      } else {
        // Apply tie break rules
        const sorted = this.resolveTie(group, matches, tieBreakRules);
        result.push(...sorted);
      }
    }

    return result;
  }

  private groupByRecord(players: Player[]): Player[][] {
    const groups = new Map<string, Player[]>();

    for (const player of players) {
      const key = `${player.matchRecord.wins}-${player.matchRecord.losses}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(player);
    }

    // Sort groups by wins (descending)
    return Array.from(groups.values()).sort((a, b) =>
      b[0].matchRecord.wins - a[0].matchRecord.wins
    );
  }

  private resolveTie(
    tiedPlayers: Player[],
    matches: Match[],
    tieBreakRules: TieBreak[]
  ): Player[] {
    let sorted = [...tiedPlayers];

    for (const rule of tieBreakRules) {
      sorted = this.applyRule(sorted, matches, rule);

      // Check if tie is resolved
      if (this.isTieResolved(sorted, matches, rule)) {
        break;
      }
    }

    return sorted;
  }

  private applyRule(
    players: Player[],
    matches: Match[],
    rule: TieBreak
  ): Player[] {
    switch (rule) {
      case 'WINS_VS_TIED':
        return this.winsVsTied(players, matches);

      case 'GAME_SET_DIFFERENCE':
        return this.gameSetDifference(players, matches);

      case 'POINTS_DIFFERENCE':
        return this.pointsDifference(players, matches);

      default:
        return players;
    }
  }

  private winsVsTied(players: Player[], matches: Match[]): Player[] {
    const h2hWins: Record<string, number> = {};

    // Get all matches between tied players
    const tiedPlayerIds = new Set(players.map(p => p.id));
    const h2hMatches = matches.filter(m =>
      m.participants.every(p => tiedPlayerIds.has(p.participantId))
    );

    // Count wins
    for (const match of h2hMatches) {
      const winnerId = match.winnerId;
      h2hWins[winnerId] = (h2hWins[winnerId] || 0) + 1;
    }

    return players.sort((a, b) =>
      (h2hWins[b.id] || 0) - (h2hWins[a.id] || 0)
    );
  }

  private gameSetDifference(players: Player[], matches: Match[]): Player[] {
    const gameDiff: Record<string, number> = {};

    for (const player of players) {
      let gamesWon = 0;
      let gamesLost = 0;

      const playerMatches = matches.filter(m =>
        m.participants.some(p => p.participantId === player.id)
      );

      for (const match of playerMatches) {
        const participant = match.participants.find(
          p => p.participantId === player.id
        )!;

        const gameScores = match.gameScores || [];

        for (const game of gameScores) {
          if (participant.position === 1) {
            if (game.player1Score > game.player2Score) {
              gamesWon++;
            } else {
              gamesLost++;
            }
          } else {
            if (game.player2Score > game.player1Score) {
              gamesWon++;
            } else {
              gamesLost++;
            }
          }
        }
      }

      gameDiff[player.id] = gamesWon - gamesLost;
    }

    return players.sort((a, b) => gameDiff[b.id] - gameDiff[a.id]);
  }

  private pointsDifference(players: Player[], matches: Match[]): Player[] {
    const pointsDiff: Record<string, number> = {};

    for (const player of players) {
      let pointsFor = 0;
      let pointsAgainst = 0;

      const playerMatches = matches.filter(m =>
        m.participants.some(p => p.participantId === player.id)
      );

      for (const match of playerMatches) {
        const participant = match.participants.find(
          p => p.participantId === player.id
        )!;

        const gameScores = match.gameScores || [];

        for (const game of gameScores) {
          if (participant.position === 1) {
            pointsFor += game.player1Score;
            pointsAgainst += game.player2Score;
          } else {
            pointsFor += game.player2Score;
            pointsAgainst += game.player1Score;
          }
        }
      }

      pointsDiff[player.id] = pointsFor - pointsAgainst;
    }

    return players.sort((a, b) => pointsDiff[b.id] - pointsDiff[a.id]);
  }

  private isTieResolved(
    players: Player[],
    matches: Match[],
    lastRule: TieBreak
  ): boolean {
    // Check if all players have different values after applying rule
    const values = players.map(p => {
      // Calculate value based on last rule applied
      // If all different, tie is resolved
      return this.calculateValue(p, matches, lastRule);
    });

    const uniqueValues = new Set(values);
    return uniqueValues.size === values.length;
  }

  private calculateValue(
    player: Player,
    matches: Match[],
    rule: TieBreak
  ): number {
    // Helper to get the value for a player based on a rule
    switch (rule) {
      case 'WINS_VS_TIED':
        return matches.filter(m => m.winnerId === player.id).length;

      case 'GAME_SET_DIFFERENCE':
        // Calculate game difference
        let gamesWon = 0, gamesLost = 0;
        // ... (same logic as gameSetDifference)
        return gamesWon - gamesLost;

      case 'POINTS_DIFFERENCE':
        // Calculate points difference
        let pointsFor = 0, pointsAgainst = 0;
        // ... (same logic as pointsDifference)
        return pointsFor - pointsAgainst;

      default:
        return 0;
    }
  }
}
```

---

## 5. Ví dụ thực tế

### Scenario: Group Stage, 4 players

**Matches:**
```
A vs B: 3-1 (11-9, 11-7, 9-11, 11-8) → A wins
A vs C: 3-0 (11-5, 11-3, 11-7) → A wins
A vs D: 2-3 (11-9, 9-11, 8-11, 11-6, 9-11) → D wins
B vs C: 3-1 (11-7, 11-9, 9-11, 11-5) → B wins
B vs D: 1-3 (9-11, 11-9, 8-11, 7-11) → D wins
C vs D: 0-3 (5-11, 7-11, 6-11) → D wins
```

**Initial Standings (by match wins):**
```
D: 3-0 (3 wins)  → Clear #1
A: 2-1 (2 wins)  ┐
B: 2-1 (2 wins)  ├─ TIE! Need tie breaks
C: 0-3 (0 wins)  → Clear #4
```

**Apply Tie Break #1: WINS_VS_TIED (A vs B)**
```
A vs B: A won → A has 1 win, B has 0 wins
Result: A #2, B #3
```

**Final Standings:**
```
1. D (3-0)
2. A (2-1, won H2H vs B)
3. B (2-1, lost H2H vs A)
4. C (0-3)
```

---

## 6. API để lấy Standings

### Endpoint
```
GET /api/admin/tournaments/:id/groups/:groupId/standings
```

### Response
```json
{
  "success": true,
  "data": {
    "groupId": "g1",
    "groupName": "Group A",
    "standings": [
      {
        "rank": 1,
        "participant": {
          "id": "p1",
          "userId": "u1",
          "user": {
            "nickname": "Player D"
          }
        },
        "matchRecord": {
          "wins": 3,
          "losses": 0
        },
        "gameRecord": {
          "wins": 9,
          "losses": 1
        },
        "pointsRecord": {
          "for": 102,
          "against": 78,
          "difference": 24
        },
        "tieBreakInfo": null
      },
      {
        "rank": 2,
        "participant": {
          "id": "p2",
          "userId": "u2",
          "user": {
            "nickname": "Player A"
          }
        },
        "matchRecord": {
          "wins": 2,
          "losses": 1
        },
        "gameRecord": {
          "wins": 8,
          "losses": 4
        },
        "pointsRecord": {
          "for": 95,
          "against": 82,
          "difference": 13
        },
        "tieBreakInfo": {
          "appliedRule": "WINS_VS_TIED",
          "vsPlayerId": "p3",
          "result": "Won H2H"
        }
      }
    ]
  }
}
```

---

## 7. Kết luận

### Tie Break Implementation:
- ✅ **Lưu chi tiết game scores** trong `gameScores` (JSON)
- ✅ **Apply rules theo thứ tự** cho đến khi phá được thế hòa
- ✅ **Support 3 rules phổ biến nhất**: H2H, Game Diff, Points Diff
- ✅ **Flexible**: Có thể thêm rules mới dễ dàng

### Data Requirements:
- Match phải có `gameScores` để tính GAME_SET_DIFFERENCE và POINTS_DIFFERENCE
- Match phải có `winnerId` để tính WINS_VS_TIED
- Participants phải có `position` để biết player 1 hay 2

**Bạn có câu hỏi gì thêm về tie breaks không?** Hoặc bạn muốn tôi implement luôn service này?
