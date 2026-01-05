'use client';

/**
 * Tournament Participants Tab (Vietnamese)
 * Manage tournament participants with add, edit, remove, bulk import, and lock
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Plus, Lock, Edit, Trash2, Search, Shuffle } from 'lucide-react';
import { participantsApi, membersApi, ApiError } from '@/lib/api-client';
import { Participant, ParticipantStatus } from '@/types/participant';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParticipantsTabProps {
  tournamentId: string;
  participantsLocked: boolean;
  onParticipantsChange: () => void;
}

interface Member {
  id: string;
  nickname: string | null;
  displayName: string | null;
  email: string;
  phone?: string | null;
  ratingPoints: number;
  totalMatches: number;
  winRate: number | null;
}

const STATUS_LABELS: Record<ParticipantStatus, string> = {
  REGISTERED: 'Đã đăng ký',
  CHECKED_IN: 'Đã check-in',
  WITHDRAWN: 'Đã rút lui',
  DISQUALIFIED: 'Bị loại',
};

const STATUS_COLORS: Record<ParticipantStatus, string> = {
  REGISTERED: 'bg-blue-500',
  CHECKED_IN: 'bg-green-500',
  WITHDRAWN: 'bg-gray-500',
  DISQUALIFIED: 'bg-red-500',
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

const formatPhoneNumber = (phone?: string | null) => {
  if (!phone) return '-';

  const digits = phone.replace(/\D/g, '');
  if (!digits) return '-';

  const normalized = digits.startsWith('84') ? `0${digits.slice(2)}` : digits;

  if (normalized.length === 10) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
  }

  if (normalized.length === 11) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7)}`;
  }

  return phone;
};

// Calculate rank from rating points
function calculateRank(rating: number): string {
  if (rating > 2200) return 'A_STAR';
  if (rating >= 2001) return 'A';
  if (rating >= 1801) return 'B';
  if (rating >= 1601) return 'C';
  if (rating >= 1401) return 'D';
  if (rating >= 1201) return 'E';
  if (rating >= 1001) return 'F';
  if (rating >= 801) return 'G';
  return 'H';
}

export function ParticipantsTab({
  tournamentId,
  participantsLocked,
  onParticipantsChange,
}: ParticipantsTabProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add participants dialog with multi-select
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<Member[]>([]);
  const [addingParticipants, setAddingParticipants] = useState(false);

  // Edit participant dialog
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editSeed, setEditSeed] = useState('');
  const [editStatus, setEditStatus] = useState<ParticipantStatus>('REGISTERED');

  // Delete confirmation
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);

  // Lock confirmation
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [seedingMethod, setSeedingMethod] = useState<'elo' | 'winRate'>('elo');
  const [seedingParticipants, setSeedingParticipants] = useState(false);

  useEffect(() => {
    fetchParticipants();
    fetchMembers();
  }, [tournamentId]);

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await participantsApi.listParticipants(tournamentId, {
        page: 1,
        limit: 100,
      });

      const participantsData = result.data || [];
      setParticipants(participantsData);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err instanceof ApiError ? err.message : 'Không thể tải danh sách người tham gia');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const result = await membersApi.listMembers({ page: 1, limit: 1000 });
      setMembers(result.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách thành viên:', err);
    }
  };

  // Filter available members (not already participating)
  const availableMembers = useMemo(() => {
    const participantUserIds = new Set(participants.map((p) => p.userId));
    return members.filter((m) => !participantUserIds.has(m.id));
  }, [members, participants]);

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return availableMembers;

    const query = searchQuery.toLowerCase();
    return availableMembers.filter((member) => {
      const displayName = member.displayName?.toLowerCase() || '';
      const nickname = member.nickname?.toLowerCase() || '';
      const email = member.email.toLowerCase();
      return displayName.includes(query) || nickname.includes(query) || email.includes(query);
    });
  }, [availableMembers, searchQuery]);

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMemberIds);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMemberIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.size === filteredMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const handleAddParticipants = async () => {
    if (selectedMemberIds.size === 0) return;

    setAddingParticipants(true);
    setError(null);

    try {
      const participantsToAdd = Array.from(selectedMemberIds).map((userId, index) => ({
        userId,
        seed: index + participants.length + 1, // Auto-assign sequential seeds
      }));

      await participantsApi.bulkImportParticipants(tournamentId, participantsToAdd);

      setShowAddDialog(false);
      setSelectedMemberIds(new Set());
      setSearchQuery('');
      fetchParticipants();
      onParticipantsChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể thêm người tham gia');
    } finally {
      setAddingParticipants(false);
    }
  };

  const handleEditParticipant = async () => {
    if (!editingParticipant) return;

    setError(null);

    try {
      await participantsApi.updateParticipant(tournamentId, editingParticipant.id, {
        seed: editSeed ? parseInt(editSeed) : undefined,
        status: editStatus,
      });
      setEditingParticipant(null);
      fetchParticipants();
      onParticipantsChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể cập nhật người tham gia');
    }
  };

  const handleRemoveParticipant = async () => {
    if (!deletingParticipant) return;

    setError(null);

    try {
      await participantsApi.removeParticipant(tournamentId, deletingParticipant.id);
      setDeletingParticipant(null);
      fetchParticipants();
      onParticipantsChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể xóa người tham gia');
    }
  };

  const handleLockParticipants = async () => {
    setError(null);

    try {
      await participantsApi.lockParticipants(tournamentId);
      setShowLockDialog(false);
      onParticipantsChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể khóa danh sách người tham gia');
    }
  };

  const handleUnlockParticipants = async () => {
    setError(null);

    try {
      await participantsApi.unlockParticipants(tournamentId);
      setShowUnlockDialog(false);
      onParticipantsChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể mở khóa danh sách người tham gia');
    }
  };

  const getParticipantDisplayName = (participant: Participant) => {
    return (
      participant.user?.fullName ||
      participant.user?.displayName ||
      participant.user?.nickname ||
      participant.user?.email ||
      ''
    );
  };

  const handleAutoSeed = async () => {
    if (participants.length === 0) return;

    setError(null);
    setSeedingParticipants(true);

    try {
      const sortedParticipants = [...participants].sort((a, b) => {
        const aWinRate = a.user?.winRate ?? -1;
        const bWinRate = b.user?.winRate ?? -1;
        const aElo = a.user?.ratingPoints ?? 1000;
        const bElo = b.user?.ratingPoints ?? 1000;

        if (seedingMethod === 'winRate') {
          if (bWinRate !== aWinRate) return bWinRate - aWinRate;
          if (bElo !== aElo) return bElo - aElo;
        } else {
          if (bElo !== aElo) return bElo - aElo;
          if (bWinRate !== aWinRate) return bWinRate - aWinRate;
        }

        return getParticipantDisplayName(a).localeCompare(getParticipantDisplayName(b));
      });

      await Promise.all(
        sortedParticipants.map((participant, index) =>
          participantsApi.updateParticipant(tournamentId, participant.id, {
            seed: index + 1,
          })
        ),
      );

      setShowSeedDialog(false);
      await fetchParticipants();
      onParticipantsChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể tự động chia hạt giống');
    } finally {
      setSeedingParticipants(false);
    }
  };

  const openEditDialog = (participant: Participant) => {
    setEditingParticipant(participant);
    setEditSeed(participant.seed?.toString() || '');
    setEditStatus(participant.status);
  };

  const formatWinRate = (winRate: number | null) => {
    if (winRate === null) return 'N/A';
    return `${winRate.toFixed(1)}%`;
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

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Người tham gia ({participants.length})</CardTitle>
              <CardDescription>
                {participantsLocked
                  ? 'Danh sách đã khóa - Không thể thêm/xóa người tham gia'
                  : 'Quản lý người tham gia giải đấu'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!participantsLocked && (
                <>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm người
                  </Button>
                  {participants.length > 0 && (
                    <Button variant="outline" onClick={() => setShowSeedDialog(true)}>
                      <Shuffle className="mr-2 h-4 w-4" />
                      Chia hạt giống
                    </Button>
                  )}
                  {participants.length > 0 && (
                    <Button variant="outline" onClick={() => setShowLockDialog(true)}>
                      <Lock className="mr-2 h-4 w-4" />
                      Khóa danh sách
                    </Button>
                  )}
                </>
              )}
              {participantsLocked && (
                <Button variant="outline" onClick={() => setShowUnlockDialog(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Mở khóa danh sách
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Chưa có người tham gia</p>
              <p className="text-sm text-muted-foreground mb-4">
                Thêm người tham gia để bắt đầu tổ chức giải đấu
              </p>
              {!participantsLocked && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm người đầu tiên
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Hạt giống</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-36">Số điện thoại</TableHead>
                    <TableHead className="text-center w-20">Hạng</TableHead>
                    <TableHead className="text-right w-24">Elo</TableHead>
                    <TableHead className="text-right w-24">Tỷ lệ thắng</TableHead>
                    <TableHead className="text-right w-20">Trận</TableHead>
                    <TableHead className="w-32">Trạng thái</TableHead>
                    <TableHead className="w-24">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => {
                    const rating = participant.user?.ratingPoints || 1000;
                    const rank = calculateRank(rating);
                    const winRate = participant.user?.winRate || null;
                    const totalMatches = participant.user?.totalMatches || 0;

                    return (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">
                          {participant.seed || '-'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {participant.user?.fullName || participant.user?.displayName || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{participant.user?.nickname || participant.user?.email?.split('@')[0] || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {participant.user?.email || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatPhoneNumber(participant.user?.phone)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={RANK_COLORS[rank]} variant="secondary">
                            {RANK_LABELS[rank]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-medium">
                            {rating}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm">
                            {formatWinRate(winRate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {totalMatches}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[participant.status]}>
                            {STATUS_LABELS[participant.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(participant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!participantsLocked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingParticipant(participant)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participants Dialog - Multi-select with Search */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Thêm người tham gia</DialogTitle>
            <DialogDescription>
              Tìm kiếm và chọn nhiều thành viên để thêm vào giải đấu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selection info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedMemberIds.size} người được chọn
              </span>
              {filteredMembers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedMemberIds.size === filteredMembers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              )}
            </div>

            {/* Members list */}
            <div className="border rounded-md max-h-96 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Không tìm thấy thành viên phù hợp' : 'Không còn thành viên khả dụng'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-36">Số điện thoại</TableHead>
                      <TableHead className="text-right">Elo</TableHead>
                      <TableHead className="text-center">Hạng</TableHead>
                      <TableHead className="text-right">Tỷ lệ thắng</TableHead>
                      <TableHead className="text-right">Trận</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const rank = calculateRank(member.ratingPoints);
                      const rankLabel = RANK_LABELS[rank];
                      const rankColor = RANK_COLORS[rank];

                      return (
                        <TableRow
                          key={member.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleToggleMember(member.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedMemberIds.has(member.id)}
                                onChange={() => handleToggleMember(member.id)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {member.displayName || member.nickname || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{member.nickname || member.email?.split('@')[0] || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {member.email}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatPhoneNumber(member.phone)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-mono font-medium">
                              {member.ratingPoints}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={rankColor} variant="secondary">
                              {rankLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm">
                              {formatWinRate(member.winRate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {member.totalMatches}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setSelectedMemberIds(new Set());
                setSearchQuery('');
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddParticipants}
              disabled={selectedMemberIds.size === 0 || addingParticipants}
            >
              {addingParticipants
                ? 'Đang thêm...'
                : `Thêm ${selectedMemberIds.size} người`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Participant Dialog */}
      {editingParticipant && (
        <Dialog open={!!editingParticipant} onOpenChange={() => setEditingParticipant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa người tham gia</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin của {editingParticipant.user?.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!participantsLocked && (
                <div>
                  <Label htmlFor="editSeed">Seed</Label>
                  <Input
                    id="editSeed"
                    type="number"
                    min="1"
                    value={editSeed}
                    onChange={(e) => setEditSeed(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="editStatus">Trạng thái</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REGISTERED">Đã đăng ký</SelectItem>
                    <SelectItem value="CHECKED_IN">Đã check-in</SelectItem>
                    <SelectItem value="WITHDRAWN">Đã rút lui</SelectItem>
                    <SelectItem value="DISQUALIFIED">Bị loại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingParticipant(null)}>
                Hủy
              </Button>
              <Button onClick={handleEditParticipant}>Cập nhật</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingParticipant}
        onOpenChange={(open) => !open && setDeletingParticipant(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người tham gia?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {deletingParticipant?.user?.fullName} khỏi giải đấu? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveParticipant}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock Confirmation Dialog */}
      <AlertDialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa danh sách người tham gia?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi khóa, bạn sẽ không thể thêm hoặc xóa người tham gia. Bạn chỉ có thể cập nhật
              trạng thái. Hành động này cần thiết trước khi bắt đầu giải đấu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleLockParticipants}>Khóa danh sách</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mở khóa danh sách người tham gia?</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi mở khóa, bạn có thể thêm hoặc xóa người tham gia. Không thể mở khóa nếu đã
              tạo bảng hoặc trận đấu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlockParticipants}>
              Mở khóa danh sách
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auto Seed Dialog */}
      <Dialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tự động chia hạt giống</DialogTitle>
            <DialogDescription>
              Sắp xếp người tham gia theo thứ tự giảm dần để gán seed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="seedingMethod">Tiêu chí sắp xếp</Label>
              <Select
                value={seedingMethod}
                onValueChange={(value) => setSeedingMethod(value as 'elo' | 'winRate')}
              >
                <SelectTrigger className="mt-1.5" id="seedingMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elo">Điểm Elo</SelectItem>
                  <SelectItem value="winRate">Tỷ lệ thắng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Seed sẽ được gán từ 1 đến {participants.length}. Dữ liệu này dùng để chia bảng hoặc tạo trận đấu.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSeedDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleAutoSeed} disabled={seedingParticipants}>
              {seedingParticipants ? 'Đang chia...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
