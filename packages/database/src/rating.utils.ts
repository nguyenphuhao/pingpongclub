/**
 * Rating & Ranking Utilities
 * 
 * Provides functions for:
 * - Calculating player rank from rating points
 * - Calculating rating changes (ELO-like system)
 * - Years of playing calculations
 */

import { PlayerRank } from '@prisma/client';

export interface RankConfig {
  rank: PlayerRank;
  minPoints: number;
  maxPoints: number | null; // null = no upper limit
  label: string;
  requiresExperience?: boolean; // For rank G
}

/**
 * Rank configuration based on requirements:
 * Hạng A* > 2200
 * Hạng A 2001 ≤ A ≤ 2200 
 * Hạng B 1801 ≤ B ≤ 2000
 * Hạng C 1601 ≤ C ≤ 1800
 * Hạng D 1401 ≤ D ≤ 1600
 * Hạng E 1201 ≤ E ≤ 1400
 * Hạng F 1001 ≤ F ≤ 1200 
 * Hạng G  801 ≤ G ≤ 1000 (chơi từ 1 năm trở xuống)
 * Hạng H  ≤ 800 (Các vdv mới bắt đầu chơi)
 */
export const RANK_CONFIGS: RankConfig[] = [
  { rank: 'A_STAR', minPoints: 2201, maxPoints: null, label: 'Hạng A*' },
  { rank: 'A', minPoints: 2001, maxPoints: 2200, label: 'Hạng A' },
  { rank: 'B', minPoints: 1801, maxPoints: 2000, label: 'Hạng B' },
  { rank: 'C', minPoints: 1601, maxPoints: 1800, label: 'Hạng C' },
  { rank: 'D', minPoints: 1401, maxPoints: 1600, label: 'Hạng D' },
  { rank: 'E', minPoints: 1201, maxPoints: 1400, label: 'Hạng E' },
  { rank: 'F', minPoints: 1001, maxPoints: 1200, label: 'Hạng F' },
  { rank: 'G', minPoints: 801, maxPoints: 1000, label: 'Hạng G', requiresExperience: true },
  { rank: 'H', minPoints: 0, maxPoints: 800, label: 'Hạng H' },
];

/**
 * Calculate player rank from rating points
 * Special rule: Rank G requires yearsPlaying <= 1
 * 
 * @param ratingPoints - Current rating points
 * @param yearsPlaying - Years of playing (optional, required for rank G)
 * @returns PlayerRank
 * 
 * @example
 * calculateRank(2250) // => 'A_STAR'
 * calculateRank(950, 0.5) // => 'G'
 * calculateRank(950, 2) // => 'F' (played > 1 year, moves up to F)
 */
export function calculateRank(
  ratingPoints: number, 
  yearsPlaying?: number | null
): PlayerRank {
  // Check rank G special condition
  if (ratingPoints >= 801 && ratingPoints <= 1000) {
    if (yearsPlaying !== null && yearsPlaying !== undefined && yearsPlaying <= 1) {
      return 'G';
    }
    // If played > 1 year with 801-1000 points, they should be rank F minimum
    return 'F';
  }
  
  // Find matching rank
  for (const config of RANK_CONFIGS) {
    if (config.rank === 'G') continue; // Already handled above
    
    if (config.maxPoints === null) {
      if (ratingPoints >= config.minPoints) return config.rank;
    } else {
      if (ratingPoints >= config.minPoints && ratingPoints <= config.maxPoints) {
        return config.rank;
      }
    }
  }
  
  return 'UNRANKED';
}

/**
 * Get rank display info by rank enum
 * 
 * @param rank - PlayerRank enum
 * @returns RankConfig or undefined
 */
export function getRankInfo(rank: PlayerRank): RankConfig | undefined {
  return RANK_CONFIGS.find(c => c.rank === rank);
}

/**
 * Get all rank configs
 */
export function getAllRanks(): RankConfig[] {
  return RANK_CONFIGS;
}

/**
 * Calculate rating change using ELO-like system
 * 
 * Formula:
 * - Expected Score = 1 / (1 + 10^((OpponentRating - PlayerRating) / 400))
 * - Rating Change = K-factor × (Actual Score - Expected Score)
 * 
 * @param playerRating - Current player rating
 * @param opponentRating - Opponent's rating
 * @param didWin - Whether player won (true) or lost (false)
 * @param kFactor - K-factor determining how much rating changes per match (default: 32)
 * @returns Rating change (positive or negative)
 * 
 * @example
 * // Player (1500) beats opponent (1600)
 * calculateRatingChange(1500, 1600, true) // => +23 (upset win)
 * 
 * // Player (1500) loses to opponent (1600)
 * calculateRatingChange(1500, 1600, false) // => -9 (expected loss)
 * 
 * // Player (1600) beats opponent (1500)
 * calculateRatingChange(1600, 1500, true) // => +9 (expected win)
 */
export function calculateRatingChange(
  playerRating: number,
  opponentRating: number,
  didWin: boolean,
  kFactor: number = 32
): number {
  // Calculate expected score (probability of winning)
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  
  // Actual score: 1 for win, 0 for loss, 0.5 for draw
  const actualScore = didWin ? 1 : 0;
  
  // Calculate rating change
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  
  return ratingChange;
}

/**
 * Calculate rating change for a draw
 */
export function calculateRatingChangeForDraw(
  playerRating: number,
  opponentRating: number,
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  const actualScore = 0.5; // Draw
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  return ratingChange;
}

/**
 * Calculate years playing from start date
 * 
 * @param startedPlayingAt - Date when player started playing
 * @returns Years playing (rounded to 1 decimal) or null if no date
 * 
 * @example
 * calculateYearsPlaying(new Date('2023-01-01')) // => 2.0 (if current year is 2025)
 */
export function calculateYearsPlaying(startedPlayingAt: Date | null): number | null {
  if (!startedPlayingAt) return null;
  
  const now = new Date();
  const diffMs = now.getTime() - startedPlayingAt.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25); // Account for leap years
  
  return Math.round(years * 10) / 10; // Round to 1 decimal place
}

/**
 * Calculate win rate from wins and total matches
 * 
 * @param wins - Number of wins
 * @param totalMatches - Total number of matches
 * @returns Win rate as percentage (0-100) rounded to 2 decimals, or null if no matches
 */
export function calculateWinRate(wins: number, totalMatches: number): number | null {
  if (totalMatches === 0) return null;
  return Math.round((wins / totalMatches) * 10000) / 100; // Round to 2 decimals
}

/**
 * Get rank color for UI display
 */
export function getRankColor(rank: PlayerRank): string {
  const colors: Record<PlayerRank, string> = {
    A_STAR: '#dc2626', // red-600
    A: '#ef4444',      // red-500
    B: '#f97316',      // orange-500
    C: '#eab308',      // yellow-500
    D: '#22c55e',      // green-500
    E: '#3b82f6',      // blue-500
    F: '#6366f1',      // indigo-500
    G: '#a855f7',      // purple-500
    H: '#6b7280',      // gray-500
    UNRANKED: '#9ca3af', // gray-400
  };
  
  return colors[rank] || colors.UNRANKED;
}

/**
 * Determine K-factor based on player rating and experience
 * Higher K-factor for newer/lower rated players = faster rating changes
 * Lower K-factor for established/higher rated players = more stable ratings
 */
export function getKFactor(ratingPoints: number, totalMatches: number): number {
  // New players (< 30 matches): K = 40 (fast adjustment)
  if (totalMatches < 30) {
    return 40;
  }
  
  // High rated players (> 2100): K = 24 (stable)
  if (ratingPoints >= 2100) {
    return 24;
  }
  
  // Regular players: K = 32 (standard)
  return 32;
}

/**
 * Validate rating points are within reasonable bounds
 */
export function isValidRating(rating: number): boolean {
  return rating >= 0 && rating <= 3500;
}

/**
 * Get rank badge text for display
 */
export function getRankBadgeText(rank: PlayerRank): string {
  const info = getRankInfo(rank);
  return info?.label || rank;
}

