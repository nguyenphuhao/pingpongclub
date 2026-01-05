'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  Search,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { groupsApi, groupParticipantsApi, participantsApi, ApiError } from '@/lib/api-client';
import { Group, GroupStatus, GroupStandings, TieBreak } from '@/types/group';
import type { Participant } from '@/types/participant';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

interface GroupsTabProps {
  tournamentId: string;
  participantsLocked: boolean;
  participantsPerGroupDefault?: number;
  participantsAdvancingDefault?: number;
  onGroupsChange?: () => void;
}

const STATUS_LABELS: Record<GroupStatus, string> = {
  PENDING: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
};

const STATUS_COLORS: Record<GroupStatus, string> = {
  PENDING: 'bg-blue-500',
  IN_PROGRESS: 'bg-green-500',
  COMPLETED: 'bg-gray-500',
};

const RANK_LABELS: Record<string, string> = {
  A_STAR: 'A*',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'H',
};

const RANK_COLORS: Record<string, string> = {
  A_STAR: 'bg-red-600 text-white',
  A: 'bg-red-500 text-white',
  B: 'bg-orange-500 text-white',
  C: 'bg-yellow-500 text-black',
  D: 'bg-green-500 text-white',
  E: 'bg-blue-500 text-white',
  F: 'bg-indigo-500 text-white',
  G: 'bg-purple-500 text-white',
  H: 'bg-gray-500 text-white',
};

const calculateRank = (rating: number): string => {
  if (rating > 2200) return 'A_STAR';
  if (rating >= 2001) return 'A';
  if (rating >= 1801) return 'B';
  if (rating >= 1601) return 'C';
  if (rating >= 1401) return 'D';
  if (rating >= 1201) return 'E';
  if (rating >= 1001) return 'F';
  if (rating >= 801) return 'G';
  return 'H';
};

const getParticipantName = (participant: Participant) => {
  return (
    participant.user?.fullName ||
    participant.user?.displayName ||
    participant.user?.nickname ||
    participant.user?.email ||
    'N/A'
  );
};

export function GroupsTab({
  tournamentId,
  participantsLocked,
  participantsPerGroupDefault = 4,
  participantsAdvancingDefault = 2,
  onGroupsChange,
}: GroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAutoDialog, setShowAutoDialog] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createParticipantsPerGroup, setCreateParticipantsPerGroup] = useState(
    participantsPerGroupDefault
  );
  const [createParticipantsAdvancing, setCreateParticipantsAdvancing] = useState(
    participantsAdvancingDefault
  );

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editParticipantsPerGroup, setEditParticipantsPerGroup] = useState(0);
  const [editParticipantsAdvancing, setEditParticipantsAdvancing] = useState(0);

  const [autoMode, setAutoMode] = useState<'count' | 'size'>('count');
  const [autoNumberOfGroups, setAutoNumberOfGroups] = useState(4);
  const [autoParticipantsPerGroup, setAutoParticipantsPerGroup] = useState(
    participantsPerGroupDefault
  );
  const [autoParticipantsAdvancing, setAutoParticipantsAdvancing] = useState(
    participantsAdvancingDefault
  );
  const [autoGroupNamePrefix, setAutoGroupNamePrefix] = useState('Bảng');
  const [autoGenerating, setAutoGenerating] = useState(false);

  const [assignGroup, setAssignGroup] = useState<Group | null>(null);
  const [groupParticipants, setGroupParticipants] = useState<Participant[]>([]);
  const [groupParticipantsMap, setGroupParticipantsMap] = useState<Record<string, Participant[]>>(
    {}
  );
  const [groupParticipantsLoading, setGroupParticipantsLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [groupStandingsMap, setGroupStandingsMap] = useState<Record<string, GroupStandings>>({});
  const [groupStandingsLoading, setGroupStandingsLoading] = useState<Record<string, boolean>>({});
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());

  const [showStandingsDialog, setShowStandingsDialog] = useState(false);
  const [standingsGroup, setStandingsGroup] = useState<Group | null>(null);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [standingsError, setStandingsError] = useState<string | null>(null);
  const [standings, setStandings] = useState<GroupStandings | null>(null);

  const canAssignParticipants =
    participantsLocked && (assignGroup?.status ? assignGroup.status === 'PENDING' : true);
  const canAutoGenerate = participantsLocked;

  useEffect(() => {
    fetchGroups();
    fetchParticipants();
  }, [tournamentId]);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await groupsApi.listGroups(tournamentId, { page: 1, limit: 50 });
      const groupsData = Array.isArray(result.data) ? result.data : result.data?.data;
      const nextGroups = groupsData || [];
      setGroups(nextGroups);
      await fetchGroupParticipantsMap(nextGroups);
      await fetchGroupStandingsMap(nextGroups);
      onGroupsChange?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách bảng');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const result = await participantsApi.listParticipants(tournamentId, {
        page: 1,
        limit: 500,
      });
      setParticipants(result.data || []);
    } catch (err) {
      console.error('Không thể tải danh sách người tham gia:', err);
    }
  };

  const fetchGroupParticipants = async (groupId: string) => {
    try {
      const result = await groupParticipantsApi.listGroupParticipants(tournamentId, groupId, {
        page: 1,
        limit: 200,
      });
      const participantsData = Array.isArray(result.data) ? result.data : result.data?.data;
      setGroupParticipants(participantsData || []);
      setGroupParticipantsMap((prev) => ({
        ...prev,
        [groupId]: participantsData || [],
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tải người tham gia trong bảng');
    }
  };

  const fetchGroupParticipantsMap = async (currentGroups: Group[]) => {
    if (currentGroups.length === 0) {
      setGroupParticipantsMap({});
      return;
    }

    const loadingMap: Record<string, boolean> = {};
    currentGroups.forEach((group) => {
      loadingMap[group.id] = true;
    });
    setGroupParticipantsLoading(loadingMap);

    let hasError = false;
    const entries = await Promise.all(
      currentGroups.map(async (group) => {
        try {
          const result = await groupParticipantsApi.listGroupParticipants(tournamentId, group.id, {
            page: 1,
            limit: 200,
          });
          const participantsData = Array.isArray(result.data) ? result.data : result.data?.data;
          return [group.id, participantsData || []] as const;
        } catch (err) {
          hasError = true;
          return [group.id, []] as const;
        }
      })
    );

    setGroupParticipantsMap(Object.fromEntries(entries));
    setGroupParticipantsLoading({});

    if (hasError) {
      setError('Không thể tải đầy đủ danh sách người tham gia theo bảng');
    }
  };

  const fetchGroupStandingsMap = async (currentGroups: Group[]) => {
    if (currentGroups.length === 0) {
      setGroupStandingsMap({});
      return;
    }

    const loadingMap: Record<string, boolean> = {};
    currentGroups.forEach((group) => {
      loadingMap[group.id] = true;
    });
    setGroupStandingsLoading(loadingMap);

    let hasError = false;
    const entries = await Promise.all(
      currentGroups.map(async (group) => {
        try {
          const result = await groupsApi.getGroupStandings(tournamentId, group.id);
          return [group.id, result] as const;
        } catch (err) {
          hasError = true;
          return [group.id, null] as const;
        }
      })
    );

    const standingsMap: Record<string, GroupStandings> = {};
    entries.forEach(([groupId, standings]) => {
      if (standings) standingsMap[groupId] = standings;
    });

    setGroupStandingsMap(standingsMap);
    setGroupStandingsLoading({});

    if (hasError) {
      setError('Không thể tải đầy đủ bảng xếp hạng');
    }
  };

  const resetCreateForm = () => {
    setCreateName('');
    setCreateDisplayName('');
    setCreateParticipantsPerGroup(participantsPerGroupDefault);
    setCreateParticipantsAdvancing(participantsAdvancingDefault);
  };

  const resetAutoForm = () => {
    setAutoMode('count');
    setAutoNumberOfGroups(4);
    setAutoParticipantsPerGroup(participantsPerGroupDefault);
    setAutoParticipantsAdvancing(participantsAdvancingDefault);
    setAutoGroupNamePrefix('Bảng');
  };

  const handleCreateGroup = async () => {
    if (!createName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      await groupsApi.createGroup(tournamentId, {
        name: createName.trim(),
        displayName: createDisplayName.trim() || undefined,
        participantsPerGroup: createParticipantsPerGroup,
        participantsAdvancing: createParticipantsAdvancing,
      });
      setShowCreateDialog(false);
      resetCreateForm();
      await fetchGroups();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tạo bảng');
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDisplayName(group.displayName);
    setEditParticipantsPerGroup(group.participantsPerGroup);
    setEditParticipantsAdvancing(group.participantsAdvancing);
    setShowEditDialog(true);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    setUpdating(true);
    setError(null);
    try {
      await groupsApi.updateGroup(tournamentId, editingGroup.id, {
        name: editName.trim() || undefined,
        displayName: editDisplayName.trim() || undefined,
        participantsPerGroup: editParticipantsPerGroup,
        participantsAdvancing: editParticipantsAdvancing,
      });
      setShowEditDialog(false);
      setEditingGroup(null);
      await fetchGroups();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể cập nhật bảng');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    setError(null);
    try {
      await groupsApi.deleteGroup(tournamentId, deletingGroup.id);
      setDeletingGroup(null);
      await fetchGroups();
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể xóa bảng');
    }
  };

  const handleAutoGenerateGroups = async () => {
    setAutoGenerating(true);
    setError(null);

    try {
      const payload: {
        numberOfGroups?: number;
        participantsPerGroup?: number;
        participantsAdvancing?: number;
        groupNamePrefix?: string;
      } = {
        participantsAdvancing: autoParticipantsAdvancing || undefined,
        groupNamePrefix: autoGroupNamePrefix.trim() || undefined,
      };

      if (autoMode === 'count') {
        payload.numberOfGroups = autoNumberOfGroups;
      } else {
        payload.participantsPerGroup = autoParticipantsPerGroup;
      }

      await groupsApi.autoGenerateGroups(tournamentId, payload);
      setShowAutoDialog(false);
      resetAutoForm();
      await fetchGroups();
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tự động chia bảng');
    } finally {
      setAutoGenerating(false);
    }
  };

  const openAssignDialog = async (group: Group) => {
    setAssignGroup(group);
    setSelectedParticipantIds(new Set());
    setAssignSearch('');
    setShowAssignDialog(true);
    await fetchGroupParticipants(group.id);
  };

  const availableParticipants = useMemo(() => {
    if (!assignGroup) return [];
    return participants.filter((participant) => !participant.groupId);
  }, [participants, assignGroup]);

  const filteredAvailableParticipants = useMemo(() => {
    if (!assignSearch.trim()) return availableParticipants;
    const query = assignSearch.toLowerCase();
    return availableParticipants.filter((participant) => {
      const name = getParticipantName(participant).toLowerCase();
      const nickname = participant.user?.nickname?.toLowerCase() || '';
      const email = participant.user?.email?.toLowerCase() || '';
      return name.includes(query) || nickname.includes(query) || email.includes(query);
    });
  }, [availableParticipants, assignSearch]);

  const handleToggleParticipant = (participantId: string) => {
    const next = new Set(selectedParticipantIds);
    if (next.has(participantId)) {
      next.delete(participantId);
    } else {
      next.add(participantId);
    }
    setSelectedParticipantIds(next);
  };

  const handleAssignParticipants = async () => {
    if (!assignGroup || selectedParticipantIds.size === 0) return;

    setAssigning(true);
    setError(null);
    try {
      await Promise.all(
        Array.from(selectedParticipantIds).map((participantId) =>
          groupParticipantsApi.addParticipantToGroup(tournamentId, assignGroup.id, {
            participantId,
          })
        )
      );
      setSelectedParticipantIds(new Set());
      await fetchGroupParticipants(assignGroup.id);
      await fetchGroups();
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể thêm người vào bảng');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!assignGroup) return;
    setError(null);
    try {
      await groupParticipantsApi.removeParticipantFromGroup(
        tournamentId,
        assignGroup.id,
        participantId
      );
      await fetchGroupParticipants(assignGroup.id);
      await fetchGroups();
      await fetchParticipants();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể gỡ người khỏi bảng');
    }
  };

  const openStandingsDialog = async (group: Group) => {
    setStandingsGroup(group);
    setStandings(null);
    setStandingsError(null);
    setShowStandingsDialog(true);
    setStandingsLoading(true);

    try {
      const cached = groupStandingsMap[group.id];
      if (cached) {
        setStandings(cached);
      } else {
        const result = await groupsApi.getGroupStandings(tournamentId, group.id);
        setStandings(result);
      }
    } catch (err) {
      setStandingsError(err instanceof ApiError ? err.message : 'Không thể tải bảng xếp hạng');
    } finally {
      setStandingsLoading(false);
    }
  };

  const formatTieBreakRule = (rule: TieBreak) => {
    switch (rule) {
      case 'WINS_VS_TIED':
        return 'Đối đầu';
      case 'GAME_SET_DIFFERENCE':
        return 'Hiệu số set';
      case 'POINTS_DIFFERENCE':
        return 'Hiệu số điểm';
      default:
        return rule;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!participantsLocked && (
        <Alert>
          <AlertDescription>
            Cần khóa danh sách người tham gia trước khi chia bảng và gán người tham gia.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Danh sách bảng ({groups.length})</CardTitle>
              <CardDescription>Quản lý bảng đấu cho vòng bảng</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setShowAutoDialog(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Tự động chia bảng
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo bảng
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Chưa có bảng nào</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tạo bảng để bắt đầu phân nhóm người tham gia
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo bảng đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => {
                const groupParticipantsList = groupParticipantsMap[group.id] || [];
                const emptySlots = Math.max(
                  0,
                  group.participantsPerGroup - groupParticipantsList.length
                );
                const showEmptySlots = Math.min(emptySlots, 3);

                return (
                  <Card key={group.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {group.displayName}
                          </CardTitle>
                          <CardDescription>
                            <span className="font-medium text-foreground">{group.name}</span> ·{' '}
                            {group.participantCount}/{group.participantsPerGroup} người · Qua vòng{' '}
                            {group.participantsAdvancing}
                          </CardDescription>
                        </div>
                        <Badge className={STATUS_COLORS[group.status]}>
                          {STATUS_LABELS[group.status]}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStandingsDialog(group)}
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAssignDialog(group)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingGroup(group)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Bảng xếp hạng</span>
                        <span>{group.matchCount} trận</span>
                      </div>
                      {groupStandingsLoading[group.id] ? (
                        <div className="text-sm text-muted-foreground">Đang tải bảng xếp hạng...</div>
                      ) : groupStandingsMap[group.id]?.standings?.length ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                            <span className="w-10 text-center">Hạng</span>
                            <span className="flex-1">Người chơi</span>
                            <span className="w-20 text-center">W-L</span>
                            <span className="w-20 text-center">Set +/-</span>
                            <span className="w-20 text-center">Điểm +/-</span>
                            <span className="w-16 text-center">Qua</span>
                          </div>
                          {groupStandingsMap[group.id].standings.map((entry) => (
                            <div
                              key={entry.participant.id}
                              className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
                            >
                              <span className="w-10 text-center font-medium">{entry.rank}</span>
                              <div className="flex-1">
                                <div className="font-medium">
                                  {entry.participant.user?.fullName ||
                                    entry.participant.user?.displayName ||
                                    entry.participant.user?.nickname ||
                                    entry.participant.user?.email ||
                                    'N/A'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.participant.user?.ratingPoints ?? 1000} Elo ·{' '}
                                  {
                                    RANK_LABELS[
                                      calculateRank(entry.participant.user?.ratingPoints ?? 1000)
                                    ]
                                  }
                                </div>
                              </div>
                              <span className="w-20 text-center">
                                {entry.matchRecord.wins}-{entry.matchRecord.losses}
                              </span>
                              <span className="w-20 text-center">
                                {entry.gameRecord.difference}
                              </span>
                              <span className="w-20 text-center">
                                {entry.pointsRecord.difference}
                              </span>
                              <span className="w-16 text-center">
                                {entry.isAdvancing ? (
                                  <Badge className="bg-green-500">Có</Badge>
                                ) : (
                                  <Badge variant="outline">Không</Badge>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : groupParticipantsLoading[group.id] ? (
                        <div className="text-sm text-muted-foreground">Đang tải danh sách...</div>
                      ) : groupParticipantsList.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Chưa có người tham gia
                        </div>
                      ) : (
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {groupParticipantsList.map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between">
                              <span>{getParticipantName(participant)}</span>
                              <span>
                                {participant.user?.ratingPoints ?? 1000} Elo ·{' '}
                                {
                                  RANK_LABELS[
                                    calculateRank(participant.user?.ratingPoints ?? 1000)
                                  ]
                                }
                              </span>
                            </div>
                          ))}
                          {showEmptySlots > 0 && (
                            <div className="space-y-1 text-xs">
                              {Array.from({ length: showEmptySlots }).map((_, index) => (
                                <div key={`empty-slot-${group.id}-${index}`}>
                                  Chưa có người
                                </div>
                              ))}
                              {emptySlots > showEmptySlots && (
                                <div>+{emptySlots - showEmptySlots} slot trống</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Generate Groups Dialog */}
      <Dialog
        open={showAutoDialog}
        onOpenChange={(open) => {
          setShowAutoDialog(open);
          if (!open) resetAutoForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tự động chia bảng</DialogTitle>
            <DialogDescription>
              Tạo bảng và gán người tham gia theo thứ tự seed (straight seeding).
            </DialogDescription>
          </DialogHeader>

          {!participantsLocked && (
            <Alert>
              <AlertDescription>
                Cần khóa danh sách người tham gia trước khi tự động chia bảng.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label>Chế độ chia bảng</Label>
              <RadioGroup
                value={autoMode}
                onValueChange={(value) => setAutoMode(value as 'count' | 'size')}
                className="mt-2 grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="count" id="auto-mode-count" />
                  <Label htmlFor="auto-mode-count">Theo số lượng bảng</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="size" id="auto-mode-size" />
                  <Label htmlFor="auto-mode-size">Theo số người mỗi bảng</Label>
                </div>
              </RadioGroup>
            </div>

            {autoMode === 'count' ? (
              <div>
                <Label htmlFor="autoNumberOfGroups">Số lượng bảng</Label>
                <Input
                  id="autoNumberOfGroups"
                  type="number"
                  min="2"
                  value={autoNumberOfGroups}
                  onChange={(e) => setAutoNumberOfGroups(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="autoParticipantsPerGroup">Số người mỗi bảng</Label>
                <Input
                  id="autoParticipantsPerGroup"
                  type="number"
                  min="2"
                  max="20"
                  value={autoParticipantsPerGroup}
                  onChange={(e) => setAutoParticipantsPerGroup(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="autoParticipantsAdvancing">Số người qua vòng</Label>
                <Input
                  id="autoParticipantsAdvancing"
                  type="number"
                  min="1"
                  value={autoParticipantsAdvancing}
                  onChange={(e) => setAutoParticipantsAdvancing(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="autoGroupNamePrefix">Prefix tên bảng</Label>
                <Input
                  id="autoGroupNamePrefix"
                  value={autoGroupNamePrefix}
                  onChange={(e) => setAutoGroupNamePrefix(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleAutoGenerateGroups}
              disabled={
                autoGenerating ||
                !canAutoGenerate ||
                (autoMode === 'count' ? !autoNumberOfGroups : !autoParticipantsPerGroup)
              }
            >
              {autoGenerating ? 'Đang chia...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo bảng mới</DialogTitle>
            <DialogDescription>Thiết lập thông tin bảng cho vòng bảng</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Tên bảng *</Label>
              <Input
                id="groupName"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="A"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="groupDisplayName">Tên hiển thị</Label>
              <Input
                id="groupDisplayName"
                value={createDisplayName}
                onChange={(e) => setCreateDisplayName(e.target.value)}
                placeholder="Group A"
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="participantsPerGroup">Số người mỗi bảng</Label>
                <Input
                  id="participantsPerGroup"
                  type="number"
                  min="2"
                  max="20"
                  value={createParticipantsPerGroup}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    setCreateParticipantsPerGroup(nextValue);
                    if (createParticipantsAdvancing >= nextValue) {
                      setCreateParticipantsAdvancing(Math.max(1, nextValue - 1));
                    }
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="participantsAdvancing">Số người qua vòng</Label>
                <Input
                  id="participantsAdvancing"
                  type="number"
                  min="1"
                  max={Math.max(1, createParticipantsPerGroup - 1)}
                  value={createParticipantsAdvancing}
                  onChange={(e) => setCreateParticipantsAdvancing(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateGroup} disabled={!createName.trim() || creating}>
              {creating ? 'Đang tạo...' : 'Tạo bảng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setEditingGroup(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật bảng</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin bảng đấu</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editGroupName">Tên bảng</Label>
              <Input
                id="editGroupName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="editGroupDisplayName">Tên hiển thị</Label>
              <Input
                id="editGroupDisplayName"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="editParticipantsPerGroup">Số người mỗi bảng</Label>
                <Input
                  id="editParticipantsPerGroup"
                  type="number"
                  min="2"
                  max="20"
                  value={editParticipantsPerGroup}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    setEditParticipantsPerGroup(nextValue);
                    if (editParticipantsAdvancing >= nextValue) {
                      setEditParticipantsAdvancing(Math.max(1, nextValue - 1));
                    }
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="editParticipantsAdvancing">Số người qua vòng</Label>
                <Input
                  id="editParticipantsAdvancing"
                  type="number"
                  min="1"
                  max={Math.max(1, editParticipantsPerGroup - 1)}
                  value={editParticipantsAdvancing}
                  onChange={(e) => setEditParticipantsAdvancing(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateGroup} disabled={updating}>
              {updating ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bảng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bảng "{deletingGroup?.displayName}"? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Participants Dialog */}
      <Dialog
        open={showAssignDialog}
        onOpenChange={(open) => {
          setShowAssignDialog(open);
          if (!open) {
            setAssignGroup(null);
            setGroupParticipants([]);
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Gán người tham gia vào bảng</DialogTitle>
            <DialogDescription>
              {assignGroup?.displayName} · {assignGroup?.participantCount}/
              {assignGroup?.participantsPerGroup}
            </DialogDescription>
          </DialogHeader>

          {!participantsLocked && (
            <Alert>
              <AlertDescription>
                Cần khóa danh sách người tham gia trước khi gán vào bảng.
              </AlertDescription>
            </Alert>
          )}

          {assignGroup?.status && assignGroup.status !== 'PENDING' && (
            <Alert>
              <AlertDescription>
                Bảng đã bắt đầu hoặc hoàn thành, không thể thêm hoặc gỡ người tham gia.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Người chưa có bảng</h4>
                <span className="text-sm text-muted-foreground">
                  {selectedParticipantIds.size} đã chọn
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="border rounded-md max-h-80 overflow-y-auto">
                {filteredAvailableParticipants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Không còn người tham gia khả dụng
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Tên</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAvailableParticipants.map((participant) => (
                        <TableRow
                          key={participant.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleToggleParticipant(participant.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedParticipantIds.has(participant.id)}
                              onChange={() => handleToggleParticipant(participant.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{getParticipantName(participant)}</div>
                            <div className="text-xs text-muted-foreground">
                              @{participant.user?.nickname || participant.user?.email?.split('@')[0] || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {participant.user?.email || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <Button
                onClick={handleAssignParticipants}
                disabled={selectedParticipantIds.size === 0 || assigning || !canAssignParticipants}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {assigning ? 'Đang gán...' : `Gán ${selectedParticipantIds.size} người`}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Người trong bảng</h4>
                <span className="text-sm text-muted-foreground">
                  {groupParticipants.length} người
                </span>
              </div>
              <div className="border rounded-md max-h-96 overflow-y-auto">
                {groupParticipants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có người trong bảng
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupParticipants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div className="font-medium">{getParticipantName(participant)}</div>
                            <div className="text-xs text-muted-foreground">
                              @{participant.user?.nickname || participant.user?.email?.split('@')[0] || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {participant.user?.email || '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveParticipant(participant.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={!canAssignParticipants}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standings Dialog */}
      <Dialog
        open={showStandingsDialog}
        onOpenChange={(open) => {
          setShowStandingsDialog(open);
          if (!open) {
            setStandingsGroup(null);
            setStandings(null);
            setStandingsError(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bảng xếp hạng</DialogTitle>
            <DialogDescription>
              {standingsGroup?.displayName || standingsGroup?.name}
            </DialogDescription>
          </DialogHeader>

          {standingsError && (
            <Alert variant="destructive">
              <AlertDescription>{standingsError}</AlertDescription>
            </Alert>
          )}

          {standingsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
          ) : standings?.standings?.length ? (
            <div className="space-y-3">
              {standings.tieBreakRules?.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Tie-break: {standings.tieBreakRules.map(formatTieBreakRule).join(' · ')}
                </div>
              )}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Hạng</TableHead>
                      <TableHead>Người chơi</TableHead>
                      <TableHead className="text-center w-24">W-L</TableHead>
                      <TableHead className="text-center w-24">Set +/-</TableHead>
                      <TableHead className="text-center w-24">Điểm +/-</TableHead>
                      <TableHead className="text-center w-24">Qua vòng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.standings.map((entry) => (
                      <TableRow key={entry.participant.id}>
                        <TableCell className="text-center font-medium">{entry.rank}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {entry.participant.user?.fullName ||
                              entry.participant.user?.displayName ||
                              entry.participant.user?.nickname ||
                              entry.participant.user?.email ||
                              'N/A'}
                          </div>
                          {entry.tieBreakInfo?.description && (
                            <div className="text-xs text-muted-foreground">
                              {entry.tieBreakInfo.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.matchRecord.wins}-{entry.matchRecord.losses}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.gameRecord.difference}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.pointsRecord.difference}
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.isAdvancing ? (
                            <Badge className="bg-green-500">Có</Badge>
                          ) : (
                            <Badge variant="outline">Không</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có bảng xếp hạng
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStandingsDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
