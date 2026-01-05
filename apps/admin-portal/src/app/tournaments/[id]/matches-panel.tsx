'use client';

import { useEffect, useMemo, useState } from 'react';
import { matchesApi, groupsApi, participantsApi, ApiError } from '@/lib/api-client';
import type { TournamentGameType } from '@/types/tournament';
import type { Group } from '@/types/group';
import type { Participant } from '@/types/participant';
import type { MatchStats, PaginatedMatches, TournamentMatch } from '@/types/match';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BracketView } from './bracket-view';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, Sparkles, CalendarDays, Pencil } from 'lucide-react';

interface MatchesPanelProps {
  tournamentId: string;
  gameType: TournamentGameType;
  includeThirdPlaceMatch?: boolean;
  groupMatchupsPerPair?: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SCHEDULED: 'Sắp diễn ra',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-green-500',
  COMPLETED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
};

const getRankLabel = (rating: number) => {
  if (rating > 2200) return 'A*';
  if (rating >= 2001) return 'A';
  if (rating >= 1801) return 'B';
  if (rating >= 1601) return 'C';
  if (rating >= 1401) return 'D';
  if (rating >= 1201) return 'E';
  if (rating >= 1001) return 'F';
  if (rating >= 801) return 'G';
  return 'H';
};

const rankColors: Record<string, string> = {
  'A*': 'bg-red-600 text-white',
  A: 'bg-red-500 text-white',
  B: 'bg-orange-500 text-white',
  C: 'bg-yellow-500 text-black',
  D: 'bg-green-500 text-white',
  E: 'bg-blue-500 text-white',
  F: 'bg-indigo-500 text-white',
  G: 'bg-purple-500 text-white',
  H: 'bg-gray-500 text-white',
};

const formatGameScores = (scores?: { player1Score: number; player2Score: number }[] | null) => {
  if (!scores || scores.length === 0) return 'Chưa có điểm';
  return scores.map((score) => `${score.player1Score}-${score.player2Score}`).join(' · ');
};

export function MatchesPanel({
  tournamentId,
  gameType,
  includeThirdPlaceMatch,
  groupMatchupsPerPair = 1,
}: MatchesPanelProps) {
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [matchesMeta, setMatchesMeta] = useState<PaginatedMatches['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<MatchStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [stageFilter, setStageFilter] = useState<'ALL' | 'FINAL' | 'GROUP'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const [roundFilter, setRoundFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bracketMatches, setBracketMatches] = useState<TournamentMatch[]>([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editCourt, setEditCourt] = useState('');
  const [editParticipant1, setEditParticipant1] = useState('');
  const [editParticipant2, setEditParticipant2] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Create match dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStage, setCreateStage] = useState<'FINAL' | 'GROUP'>('FINAL');
  const [createGroupId, setCreateGroupId] = useState('');
  const [createRound, setCreateRound] = useState('1');
  const [createMatchNumber, setCreateMatchNumber] = useState('1');
  const [createParticipant1, setCreateParticipant1] = useState('');
  const [createParticipant2, setCreateParticipant2] = useState('');
  const [createMatchDate, setCreateMatchDate] = useState('');
  const [createCourtNumber, setCreateCourtNumber] = useState('');
  const [createIsPlacement, setCreateIsPlacement] = useState(false);
  const [createPlacementRank, setCreatePlacementRank] = useState('3');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Delete single match
  const [deletingSingleMatch, setDeletingSingleMatch] = useState<TournamentMatch | null>(null);
  const [deleteSingleError, setDeleteSingleError] = useState<string | null>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);

  const isTwoStages = gameType === 'TWO_STAGES';

  const formatParticipantLabel = (participant: Participant) => {
    const displayName =
      participant.user?.displayName ||
      participant.user?.fullName ||
      participant.user?.nickname ||
      (participant as any).displayName ||
      'TBD';
    return displayName;
  };

  const fetchStats = async () => {
    try {
      const result = await matchesApi.getStats(tournamentId);
      setStats(result.data || null);
    } catch (err) {
      setStatsError(err instanceof ApiError ? err.message : 'Không thể tải thống kê trận đấu');
    }
  };

  const fetchGroups = async () => {
    if (!isTwoStages) return;
    try {
      const result = await groupsApi.listGroups(tournamentId, { page: 1, limit: 50 });
      const groupsData = Array.isArray(result.data) ? result.data : result.data?.data;
      setGroups(groupsData || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách bảng');
    }
  };

  const fetchParticipants = async () => {
    setParticipantsLoading(true);
    setEditError(null);
    try {
      const result = await participantsApi.listParticipants(tournamentId, { page: 1, limit: 200 });
      const participantsData = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.data?.data)
        ? result.data.data
        : Array.isArray(result)
        ? result
        : [];
      setAvailableParticipants(participantsData || []);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Không thể tải danh sách người tham gia');
    } finally {
      setParticipantsLoading(false);
    }
  };

  const fetchBracketMatches = async () => {
    setBracketLoading(true);
    setBracketError(null);
    try {
      const result = await matchesApi.listMatches(tournamentId, {
        stage: 'FINAL',
        page: 1,
        limit: 200,
      });
      const payload = result.data as { data?: PaginatedMatches['data'] } | undefined;
      setBracketMatches(payload?.data || []);
    } catch (err) {
      setBracketError(err instanceof ApiError ? err.message : 'Không thể tải sơ đồ nhánh');
    } finally {
      setBracketLoading(false);
    }
  };

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    setDeleteError(null);
    try {
      const result = await matchesApi.listMatches(tournamentId, {
        stage: stageFilter === 'ALL' ? undefined : stageFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        round: roundFilter === '' ? undefined : roundFilter,
        groupId: stageFilter === 'GROUP' && groupFilter !== 'ALL' ? groupFilter : undefined,
        page,
        limit: 20,
      });

      const payload = result.data as { data?: PaginatedMatches['data']; meta?: PaginatedMatches['meta'] } | undefined;
      setMatches(payload?.data || []);
      setMatchesMeta(payload?.meta || null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách trận đấu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchGroups();
    fetchBracketMatches();
  }, [tournamentId]);

  useEffect(() => {
    fetchMatches();
    if (stageFilter === 'FINAL' || stageFilter === 'ALL') {
      fetchBracketMatches();
    }
  }, [tournamentId, stageFilter, statusFilter, roundFilter, page, groupFilter]);

  const orderedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (a.stage !== b.stage) {
        return a.stage === 'GROUP' ? -1 : 1;
      }
      if (a.round !== b.round) return a.round - b.round;
      return a.matchNumber - b.matchNumber;
    });
  }, [matches]);

  const groupedMatches = useMemo(() => {
    const totalFinalRounds = orderedMatches
      .filter((match) => match.stage === 'FINAL')
      .reduce((max, match) => Math.max(max, match.round), 0);
    const groups = new Map<string, { key: string; label: string; matches: TournamentMatch[] }>();

    const getFinalRoundLabel = (round: number) => {
      if (!totalFinalRounds) {
        return `Vòng ${round}`;
      }

      const roundsLeft = totalFinalRounds - round;
      if (roundsLeft === 0) return 'Chung kết';
      if (roundsLeft === 1) return 'Bán kết';
      if (roundsLeft === 2) return 'Tứ kết';
      if (roundsLeft === 3) return 'Vòng 1/8';
      if (roundsLeft === 4) return 'Vòng 1/16';

      const bracketSize = Math.pow(2, roundsLeft + 1);
      return `Vòng 1/${bracketSize}`;
    };

    orderedMatches.forEach((match) => {
      const stageLabel = match.stage === 'GROUP' ? 'Vòng bảng' : 'Vòng cuối';
      const roundLabel =
        match.stage === 'GROUP' ? `Lượt ${match.round}` : getFinalRoundLabel(match.round);
      const label = match.stage === 'GROUP' ? `${stageLabel} · ${roundLabel}` : roundLabel;
      const key = match.stage === 'GROUP'
        ? `GROUP-${match.round}`
        : `FINAL-${match.round}`;

      const group = groups.get(key);
      if (group) {
        group.matches.push(match);
      } else {
        groups.set(key, { key, label, matches: [match] });
      }
    });

    return Array.from(groups.values());
  }, [orderedMatches]);

  const totalFinalRounds = useMemo(() => {
    return matches
      .filter((match) => match.stage === 'FINAL')
      .reduce((max, match) => Math.max(max, match.round), 0);
  }, [matches]);

  const getFinalRoundLabel = (round: number) => {
    if (!totalFinalRounds) {
      return `Vòng ${round}`;
    }

    const roundsLeft = totalFinalRounds - round;
    if (roundsLeft === 0) return 'Chung kết';
    if (roundsLeft === 1) return 'Bán kết';
    if (roundsLeft === 2) return 'Tứ kết';
    if (roundsLeft === 3) return 'Vòng 1/8';
    if (roundsLeft === 4) return 'Vòng 1/16';

    const bracketSize = Math.pow(2, roundsLeft + 1);
    return `Vòng 1/${bracketSize}`;
  };

  const formatParticipantName = (match: TournamentMatch, name: string) => {
    if (match.stage !== 'FINAL') {
      return name;
    }

    return name.replace(/\(Vòng (\d+)\)/, (_, roundText) => {
      const roundLabel = getFinalRoundLabel(Number(roundText));
      return `(${roundLabel})`;
    });
  };

  const totalPages = matchesMeta?.totalPages || 1;

  const handleGenerateFinal = async () => {
    setGenerating(true);
    setGenerateError(null);
    setDeleteError(null);
    try {
      await matchesApi.generateMatches(tournamentId, {
        stage: 'FINAL',
        includeThirdPlaceMatch: includeThirdPlaceMatch ?? false,
      });
      await fetchMatches();
      await fetchStats();
      await fetchBracketMatches();
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : 'Không thể tạo matches vòng cuối');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateGroup = async () => {
    if (groupFilter === 'ALL') {
      setGenerateError('Vui lòng chọn một bảng cụ thể để tạo lịch');
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setDeleteError(null);
    try {
      await matchesApi.generateMatches(tournamentId, {
        stage: 'GROUP',
        groupId: groupFilter,
        matchupsPerPair: groupMatchupsPerPair,
      });
      await fetchMatches();
      await fetchStats();
    } catch (err) {
      setGenerateError(err instanceof ApiError ? err.message : 'Không thể tạo lịch vòng bảng');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteAllMatches = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await matchesApi.deleteAllMatches(tournamentId);
      setDeleteOpen(false);
      await fetchMatches();
      await fetchStats();
      await fetchBracketMatches();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Không thể xóa trận đấu');
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (match: TournamentMatch) => {
    setEditingMatch(match);
    setEditDate(match.matchDate ? new Date(match.matchDate).toISOString().slice(0, 16) : '');
    setEditCourt(match.courtNumber || '');
    const participant1 = match.participants.find((participant) => participant.position === 1);
    const participant2 = match.participants.find((participant) => participant.position === 2);
    setEditParticipant1(participant1?.participantId || '');
    setEditParticipant2(participant2?.participantId || '');
    setEditError(null);
    setEditOpen(true);
    fetchParticipants();
  };

  const closeEditDialog = (open: boolean) => {
    setEditOpen(open);
    if (!open) {
      setEditingMatch(null);
      setEditDate('');
      setEditCourt('');
      setEditParticipant1('');
      setEditParticipant2('');
      setEditError(null);
    }
  };

  const handleUpdateMatch = async () => {
    if (!editingMatch) return;
    setEditSaving(true);
    setEditError(null);

    try {
      const payload: any = {};

      if (editDate) {
        payload.matchDate = new Date(editDate).toISOString();
      } else {
        payload.matchDate = null;
      }

      payload.courtNumber = editCourt.trim() ? editCourt.trim() : null;

      if (editParticipant1 && editParticipant2) {
        payload.participants = [
          { participantId: editParticipant1, position: 1 },
          { participantId: editParticipant2, position: 2 },
        ];
      }

      await matchesApi.updateMatch(tournamentId, editingMatch.id, payload);
      closeEditDialog(false);
      await fetchMatches();
      await fetchStats();
      await fetchBracketMatches();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Không thể cập nhật trận đấu');
    } finally {
      setEditSaving(false);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!editingMatch) return [];

    const baseList = editingMatch.stage === 'GROUP' && editingMatch.groupId
      ? availableParticipants.filter((participant) => participant.groupId === editingMatch.groupId)
      : availableParticipants;

    const currentParticipants = editingMatch.participants.map((participant) => ({
      id: participant.participantId,
      tournamentId: editingMatch.tournamentId,
      userId: participant.participant?.user?.id || '',
      groupId: editingMatch.groupId || undefined,
      status: 'REGISTERED',
      createdAt: new Date().toISOString(),
      user: participant.participant?.user
        ? {
            id: participant.participant?.user?.id || participant.participantId,
            email: participant.participant?.user?.email || '',
            phone: participant.participant?.user?.phone,
            fullName: participant.participant?.user?.fullName,
            nickname: participant.participant?.user?.nickname,
            displayName: participant.participant?.user?.displayName,
            ratingPoints: participant.participant?.user?.ratingPoints,
          }
        : undefined,
      displayName: participant.participant?.displayName,
    })) as Participant[];

    const merged = [...baseList];
    currentParticipants.forEach((participant) => {
      if (!merged.find((item) => item.id === participant.id)) {
        merged.push(participant);
      }
    });

    // Calculate match count for each participant
    const participantsWithMatchCount = merged.map((participant) => {
      const matchCount = matches.filter((match) =>
        match.participants.some((mp) => mp.participantId === participant.id)
      ).length;

      return {
        ...participant,
        matchCount,
      };
    });

    // Sort by: Elo desc, then by match count asc
    return participantsWithMatchCount.sort((a, b) => {
      const aElo = a.user?.ratingPoints ?? 0;
      const bElo = b.user?.ratingPoints ?? 0;

      if (bElo !== aElo) {
        return bElo - aElo;
      }

      return a.matchCount - b.matchCount;
    });
  }, [availableParticipants, editingMatch, matches]);

  const createFilteredParticipants = useMemo(() => {
    const filtered =
      createStage === 'GROUP' && createGroupId
        ? availableParticipants.filter((p) => p.groupId === createGroupId)
        : availableParticipants;

    // Calculate match count for each participant
    const participantsWithMatchCount = filtered.map((participant) => {
      const matchCount = matches.filter((match) =>
        match.participants.some((mp) => mp.participantId === participant.id)
      ).length;

      return {
        ...participant,
        matchCount,
      };
    });

    // Sort by: Elo desc, then by match count asc (prefer participants with fewer matches)
    return participantsWithMatchCount.sort((a, b) => {
      const aElo = a.user?.ratingPoints ?? 0;
      const bElo = b.user?.ratingPoints ?? 0;

      if (bElo !== aElo) {
        return bElo - aElo; // Higher Elo first
      }

      return a.matchCount - b.matchCount; // Fewer matches first
    });
  }, [availableParticipants, createStage, createGroupId, matches]);

  const resetCreateForm = () => {
    setCreateStage('FINAL');
    setCreateGroupId('');
    setCreateRound('1');
    setCreateMatchNumber('1');
    setCreateParticipant1('');
    setCreateParticipant2('');
    setCreateMatchDate('');
    setCreateCourtNumber('');
    setCreateIsPlacement(false);
    setCreatePlacementRank('3');
    setCreateError(null);
  };

  const openCreateDialog = () => {
    resetCreateForm();
    setShowCreateDialog(true);
    fetchParticipants();
  };

  const handleCreateMatch = async () => {
    setCreating(true);
    setCreateError(null);

    try {
      const payload: any = {
        stage: createStage,
        round: parseInt(createRound),
        matchNumber: parseInt(createMatchNumber),
      };

      if (createStage === 'GROUP') {
        if (!createGroupId) {
          setCreateError('Vui lòng chọn bảng');
          setCreating(false);
          return;
        }
        payload.groupId = createGroupId;
      }

      if (createMatchDate) {
        payload.matchDate = new Date(createMatchDate).toISOString();
      }

      if (createCourtNumber.trim()) {
        payload.courtNumber = createCourtNumber.trim();
      }

      if (createIsPlacement) {
        payload.isPlacementMatch = true;
        payload.placementRank = parseInt(createPlacementRank);
      }

      if (createParticipant1 && createParticipant2) {
        payload.participants = [
          { participantId: createParticipant1, position: 1 },
          { participantId: createParticipant2, position: 2 },
        ];
      }

      await matchesApi.createMatch(tournamentId, payload);
      setShowCreateDialog(false);
      resetCreateForm();
      await fetchMatches();
      await fetchStats();
      await fetchBracketMatches();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Không thể tạo trận đấu');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSingleMatch = async () => {
    if (!deletingSingleMatch) return;

    setDeletingSingle(true);
    setDeleteSingleError(null);

    try {
      await matchesApi.deleteMatch(tournamentId, deletingSingleMatch.id);
      setDeletingSingleMatch(null);
      await fetchMatches();
      await fetchStats();
      await fetchBracketMatches();
    } catch (err) {
      setDeleteSingleError(err instanceof ApiError ? err.message : 'Không thể xóa trận đấu');
    } finally {
      setDeletingSingle(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trận đấu</CardTitle>
        <CardDescription>Lịch thi đấu và kết quả</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statsError && (
          <Alert variant="destructive">
            <AlertDescription>{statsError}</AlertDescription>
          </Alert>
        )}
        {stats && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>Tổng: {stats.total}</span>
            {stats.byStage?.map((item) => (
              <span key={item.stage}>
                {item.stage === 'GROUP' ? 'Vòng bảng' : 'Vòng cuối'}: {item.count}
              </span>
            ))}
            {stats.byStatus?.map((item) => (
              <span key={item.status}>
                {STATUS_LABELS[item.status] || item.status}: {item.count}
              </span>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {generateError && (
          <Alert variant="destructive">
            <AlertDescription>{generateError}</AlertDescription>
          </Alert>
        )}
        {deleteError && (
          <Alert variant="destructive">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}
        {deleteSingleError && (
          <Alert variant="destructive">
            <AlertDescription>{deleteSingleError}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Stage</Label>
            <Tabs value={stageFilter} onValueChange={(value) => {
              setStageFilter(value as 'ALL' | 'FINAL' | 'GROUP');
              setPage(1);
            }}>
              <TabsList className="flex flex-wrap justify-start">
                <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                <TabsTrigger value="GROUP">Vòng bảng</TabsTrigger>
                <TabsTrigger value="FINAL">Vòng cuối</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {isTwoStages && stageFilter === 'GROUP' && (
            <div>
              <Label>Chọn bảng</Label>
              <Tabs value={groupFilter} onValueChange={(value) => {
                setGroupFilter(value);
                setPage(1);
              }}>
                <TabsList className="flex flex-wrap justify-start">
                  <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                  {groups.map((group) => (
                    <TabsTrigger key={group.id} value={group.id}>
                      {group.displayName}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
          <div>
            <Label>Status</Label>
            <Tabs value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}>
              <TabsList className="flex flex-wrap justify-start">
                <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                <TabsTrigger value="SCHEDULED">Sắp diễn ra</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS">Đang diễn ra</TabsTrigger>
                <TabsTrigger value="COMPLETED">Hoàn tất</TabsTrigger>
                <TabsTrigger value="CANCELLED">Đã hủy</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="w-32">
            <Label htmlFor="roundFilter">Vòng</Label>
            <Input
              id="roundFilter"
              type="number"
              min="1"
              value={roundFilter}
              onChange={(event) => {
                const value = event.target.value;
                setRoundFilter(value ? Number(value) : '');
                setPage(1);
              }}
            />
          </div>
          <Button variant="outline" onClick={() => fetchMatches()}>
            Làm mới
          </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreateDialog} disabled={generating || deleting} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Tạo trận thủ công
            </Button>
            <Button
              onClick={handleGenerateFinal}
              disabled={generating || stageFilter === 'GROUP'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? 'Đang tạo...' : 'Tạo trận tự động'}
            </Button>
            {isTwoStages && (
              <Button
                onClick={handleGenerateGroup}
                disabled={generating || stageFilter !== 'GROUP'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {generating ? 'Đang tạo...' : 'Tạo lịch bảng'}
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={generating || deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa tất cả trận
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6 text-muted-foreground">Đang tải...</div>
        ) : orderedMatches.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">Không có trận đấu</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">#</TableHead>
                  <TableHead className="w-24">Stage</TableHead>
                  <TableHead className="w-56">Người chơi</TableHead>
                  <TableHead className="w-20">Sân</TableHead>
                  <TableHead className="w-40">Lịch</TableHead>
                  <TableHead className="w-32">Tỷ số</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="w-24 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  return groupedMatches.map((stageGroup) => {
                  if (stageGroup.matches.length === 0) {
                    return null;
                  }

                  let runningIndex = 0;

                  return (
                    <>
                      <TableRow key={stageGroup.key} className="bg-muted/60">
                        <TableCell colSpan={8} className="text-sm font-semibold text-foreground">
                          {stageGroup.label}
                        </TableCell>
                      </TableRow>
                      {stageGroup.matches.map((match) => {
                        const [home, away] = match.participants;
                        const homeParticipant = home?.participant;
                        const awayParticipant = away?.participant;
                        const rawHomeName =
                          homeParticipant?.user?.displayName ||
                          homeParticipant?.user?.fullName ||
                          homeParticipant?.user?.nickname ||
                          homeParticipant?.displayName ||
                          'TBD';
                        const rawAwayName =
                          awayParticipant?.user?.displayName ||
                          awayParticipant?.user?.fullName ||
                          awayParticipant?.user?.nickname ||
                          awayParticipant?.displayName ||
                          'TBD';
                        const homeName = formatParticipantName(match, rawHomeName);
                        const awayName = formatParticipantName(match, rawAwayName);
                        const homeRating = homeParticipant?.user?.ratingPoints ?? null;
                        const awayRating = awayParticipant?.user?.ratingPoints ?? null;
                        const homeRank = homeRating ? getRankLabel(homeRating) : null;
                        const awayRank = awayRating ? getRankLabel(awayRating) : null;
                        const matchTime = match.matchDate
                          ? new Date(match.matchDate).toLocaleString()
                          : 'Chưa lên lịch';
                        runningIndex += 1;
                        const matchIndex = runningIndex;

                        return (
                          <TableRow key={match.id}>
                            <TableCell className="text-center font-medium">{matchIndex}</TableCell>
                            <TableCell>
                              {match.stage === 'GROUP'
                                ? match.group?.displayName
                                : `Vòng ${match.round}`}
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium truncate flex-1" title={homeName}>
                                    {homeName}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {homeRating && (
                                      <span className="text-[11px] text-muted-foreground">
                                        {homeRating}
                                      </span>
                                    )}
                                    {homeRank && (
                                      <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${rankColors[homeRank]}`}
                                        title={homeRank}
                                      >
                                        {homeRank}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium truncate flex-1" title={awayName}>
                                    {awayName}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {awayRating && (
                                      <span className="text-[11px] text-muted-foreground">
                                        {awayRating}
                                      </span>
                                    )}
                                    {awayRank && (
                                      <span
                                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${rankColors[awayRank]}`}
                                        title={awayRank}
                                      >
                                        {awayRank}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>Sân {match.courtNumber || '-'}</TableCell>
                            <TableCell>{matchTime}</TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                Set: {formatGameScores(match.gameScores)}
                              </div>
                              <div className="text-sm font-semibold">
                                Chung cuộc: {match.finalScore || 'Chưa có'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[match.status] || 'bg-gray-500'} text-white`}
                              >
                                {STATUS_LABELS[match.status] || match.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(match)}
                                  disabled={match.status === 'COMPLETED'}
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                  title="Sửa trận đấu"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingSingleMatch(match)}
                                  disabled={match.status === 'COMPLETED'}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Xóa trận đấu"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </>
                  );
                });
                })()}
              </TableBody>
            </Table>
          </div>
        )}

        {(stageFilter === 'FINAL' || stageFilter === 'ALL') && (
          <BracketView matches={bracketMatches} loading={bracketLoading} error={bracketError} />
        )}

        {matchesMeta && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <span>
              Trang {matchesMeta.page} / {matchesMeta.totalPages} · {matchesMeta.total} trận
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}

        <Dialog open={editOpen} onOpenChange={closeEditDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cập nhật trận đấu</DialogTitle>
              <DialogDescription>
                {editingMatch
                  ? `Vòng ${editingMatch.round} · Trận ${editingMatch.matchNumber}`
                  : 'Cập nhật lịch thi đấu và người chơi'}
              </DialogDescription>
            </DialogHeader>

            {editError && (
              <Alert variant="destructive">
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="editMatchDate">Thời gian</Label>
                <Input
                  id="editMatchDate"
                  type="datetime-local"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="editCourt">Sân</Label>
                <Input
                  id="editCourt"
                  value={editCourt}
                  onChange={(event) => setEditCourt(event.target.value)}
                  placeholder="VD: Court 1"
                  className="mt-1.5"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Người chơi</Label>
                  <span className="text-xs text-muted-foreground">
                    {filteredParticipants.length} người khả dụng
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="editParticipant1" className="text-xs text-muted-foreground">
                      Người chơi 1
                    </Label>
                    <Select
                      value={editParticipant1}
                      onValueChange={(value) => setEditParticipant1(value)}
                    >
                      <SelectTrigger id="editParticipant1" className="mt-1.5">
                        <SelectValue placeholder={participantsLoading ? 'Đang tải...' : 'Chọn người chơi'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredParticipants.map((participant) => {
                          const elo = participant.user?.ratingPoints ?? 1000;
                          const rank = getRankLabel(elo);
                          const rankColor = rankColors[rank];
                          const matchCount = (participant as any).matchCount || 0;

                          return (
                            <SelectItem key={participant.id} value={participant.id}>
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {formatParticipantLabel(participant)}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">{elo}</span> Elo
                                    </span>
                                    <span>·</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${rankColor}`}
                                    >
                                      {rank}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                      {matchCount} trận
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="editParticipant2" className="text-xs text-muted-foreground">
                      Người chơi 2
                    </Label>
                    <Select
                      value={editParticipant2}
                      onValueChange={(value) => setEditParticipant2(value)}
                    >
                      <SelectTrigger id="editParticipant2" className="mt-1.5">
                        <SelectValue placeholder={participantsLoading ? 'Đang tải...' : 'Chọn người chơi'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredParticipants.map((participant) => {
                          const elo = participant.user?.ratingPoints ?? 1000;
                          const rank = getRankLabel(elo);
                          const rankColor = rankColors[rank];
                          const matchCount = (participant as any).matchCount || 0;

                          return (
                            <SelectItem key={participant.id} value={participant.id}>
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {formatParticipantLabel(participant)}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">{elo}</span> Elo
                                    </span>
                                    <span>·</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${rankColor}`}
                                    >
                                      {rank}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                      {matchCount} trận
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                  💡 <strong>Sắp xếp:</strong> Elo cao → thấp, ưu tiên người có ít trận hơn
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => closeEditDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateMatch} disabled={editSaving}>
                {editSaving ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>

      {/* Delete All Matches Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tất cả trận đấu?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ xóa toàn bộ trận đấu đã tạo. Không thể thực hiện nếu có trận đã
              hoàn tất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllMatches} disabled={deleting}>
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Match Dialog */}
      <AlertDialog
        open={!!deletingSingleMatch}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSingleMatch(null);
            setDeleteSingleError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trận đấu?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingSingleMatch?.status === 'COMPLETED' ? (
                <span className="text-red-600 font-medium">
                  Không thể xóa trận đấu đã hoàn thành. Vui lòng đổi trạng thái trước khi xóa.
                </span>
              ) : (
                <>
                  Bạn có chắc chắn muốn xóa trận đấu này?
                  <div className="mt-2 p-3 rounded-md bg-muted text-foreground">
                    <div className="text-sm font-medium">
                      {deletingSingleMatch?.stage === 'GROUP' ? 'Vòng bảng' : 'Vòng cuối'} ·{' '}
                      Vòng {deletingSingleMatch?.round} · Trận {deletingSingleMatch?.matchNumber}
                    </div>
                    {deletingSingleMatch?.participants && deletingSingleMatch.participants.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {deletingSingleMatch.participants
                          .map(
                            (p) =>
                              p.participant?.user?.displayName ||
                              p.participant?.user?.nickname ||
                              'TBD'
                          )
                          .join(' vs ')}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    Hành động này không thể hoàn tác.
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteSingleError && (
            <Alert variant="destructive">
              <AlertDescription>{deleteSingleError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingleMatch}
              disabled={
                deletingSingle ||
                deletingSingleMatch?.status === 'COMPLETED'
              }
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingSingle ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Match Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo trận đấu thủ công</DialogTitle>
            <DialogDescription>
              Tạo trận đấu mới cho giải đấu. Có thể tạo trận TBD (chưa có người chơi).
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <Alert variant="destructive">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Stage Selection */}
            <div>
              <Label>Stage *</Label>
              <RadioGroup
                value={createStage}
                onValueChange={(value) => setCreateStage(value as 'FINAL' | 'GROUP')}
                className="mt-2 grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FINAL" id="create-stage-final" />
                  <Label htmlFor="create-stage-final" className="font-normal">
                    Vòng cuối (FINAL)
                  </Label>
                </div>
                {isTwoStages && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="GROUP" id="create-stage-group" />
                    <Label htmlFor="create-stage-group" className="font-normal">
                      Vòng bảng (GROUP)
                    </Label>
                  </div>
                )}
              </RadioGroup>
            </div>

            {/* Group Selection (if GROUP stage) */}
            {createStage === 'GROUP' && (
              <div>
                <Label htmlFor="createGroupId">Chọn bảng *</Label>
                <Select value={createGroupId} onValueChange={setCreateGroupId}>
                  <SelectTrigger id="createGroupId" className="mt-1.5">
                    <SelectValue placeholder="Chọn bảng" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Round & Match Number */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="createRound">Vòng *</Label>
                <Input
                  id="createRound"
                  type="number"
                  min="1"
                  value={createRound}
                  onChange={(e) => setCreateRound(e.target.value)}
                  placeholder="1"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Số vòng đấu (1, 2, 3,...)
                </p>
              </div>
              <div>
                <Label htmlFor="createMatchNumber">Số trận *</Label>
                <Input
                  id="createMatchNumber"
                  type="number"
                  min="1"
                  value={createMatchNumber}
                  onChange={(e) => setCreateMatchNumber(e.target.value)}
                  placeholder="1"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Thứ tự trận trong vòng
                </p>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Người chơi (có thể để trống cho TBD match)</Label>
                <span className="text-xs text-muted-foreground">
                  {createFilteredParticipants.length} người khả dụng
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="createParticipant1" className="text-xs text-muted-foreground">
                    Người chơi 1
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Select value={createParticipant1} onValueChange={setCreateParticipant1}>
                      <SelectTrigger id="createParticipant1">
                        <SelectValue
                          placeholder={participantsLoading ? 'Đang tải...' : 'TBD (chưa xác định)'}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {createFilteredParticipants.map((participant) => {
                          const elo = participant.user?.ratingPoints ?? 1000;
                          const rank = getRankLabel(elo);
                          const rankColor = rankColors[rank];
                          const matchCount = (participant as any).matchCount || 0;

                          return (
                            <SelectItem key={participant.id} value={participant.id}>
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {formatParticipantLabel(participant)}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">{elo}</span> Elo
                                    </span>
                                    <span>·</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${rankColor}`}
                                    >
                                      {rank}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                      {matchCount} trận
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {createParticipant1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setCreateParticipant1('')}
                        title="Xóa chọn"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="createParticipant2" className="text-xs text-muted-foreground">
                    Người chơi 2
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Select value={createParticipant2} onValueChange={setCreateParticipant2}>
                      <SelectTrigger id="createParticipant2">
                        <SelectValue
                          placeholder={participantsLoading ? 'Đang tải...' : 'TBD (chưa xác định)'}
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {createFilteredParticipants.map((participant) => {
                          const elo = participant.user?.ratingPoints ?? 1000;
                          const rank = getRankLabel(elo);
                          const rankColor = rankColors[rank];
                          const matchCount = (participant as any).matchCount || 0;

                          return (
                            <SelectItem key={participant.id} value={participant.id}>
                              <div className="flex items-center gap-3 py-1">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">
                                    {formatParticipantLabel(participant)}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <span className="font-semibold">{elo}</span> Elo
                                    </span>
                                    <span>·</span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${rankColor}`}
                                    >
                                      {rank}
                                    </span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                      {matchCount} trận
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {createParticipant2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setCreateParticipant2('')}
                        title="Xóa chọn"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                💡 <strong>Sắp xếp:</strong> Elo cao → thấp, ưu tiên người có ít trận hơn
              </div>
            </div>

            {/* Match Date & Court */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="createMatchDate">Thời gian</Label>
                <Input
                  id="createMatchDate"
                  type="datetime-local"
                  value={createMatchDate}
                  onChange={(e) => setCreateMatchDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="createCourtNumber">Sân</Label>
                <Input
                  id="createCourtNumber"
                  value={createCourtNumber}
                  onChange={(e) => setCreateCourtNumber(e.target.value)}
                  placeholder="VD: Court 1"
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Placement Match Options */}
            {createStage === 'FINAL' && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createIsPlacement"
                    checked={createIsPlacement}
                    onCheckedChange={(checked) => setCreateIsPlacement(checked as boolean)}
                  />
                  <Label htmlFor="createIsPlacement" className="font-normal cursor-pointer">
                    Trận tranh hạng (Placement Match)
                  </Label>
                </div>
                {createIsPlacement && (
                  <div>
                    <Label htmlFor="createPlacementRank" className="text-xs text-muted-foreground">
                      Hạng tranh giành
                    </Label>
                    <Input
                      id="createPlacementRank"
                      type="number"
                      min="3"
                      value={createPlacementRank}
                      onChange={(e) => setCreatePlacementRank(e.target.value)}
                      placeholder="3"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Thường là 3 cho trận tranh hạng 3-4
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <Alert>
              <AlertDescription>
                💡 <strong>Lưu ý:</strong> Bạn có thể tạo trận TBD (chưa có người chơi) bằng cách
                không chọn người chơi. Sau đó có thể cập nhật người chơi khi biết kết quả các trận
                trước.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateMatch}
              disabled={
                creating ||
                !createRound ||
                !createMatchNumber ||
                (createStage === 'GROUP' && !createGroupId)
              }
            >
              {creating ? 'Đang tạo...' : 'Tạo trận đấu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
