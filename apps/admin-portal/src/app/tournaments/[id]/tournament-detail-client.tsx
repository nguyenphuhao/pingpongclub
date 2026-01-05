'use client';

/**
 * Tournament Detail Client Component (Vietnamese)
 * View and manage tournament details
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Calendar,
  Trophy,
  FileText,
  Settings,
} from 'lucide-react';
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
import { Tournament, TournamentStatus, TournamentGameType } from '@/types/tournament';
import { tournamentsApi, ApiError } from '@/lib/api-client';
import { TournamentFormDialog } from '../tournament-form-dialog';
import { format } from 'date-fns';
import { ParticipantsTab } from './participants-tab';
import { GroupsTab } from './groups-tab';
import { MatchesPanel } from './matches-panel';

interface TournamentDetailClientProps {
  tournamentId: string;
}

const STATUS_COLORS: Record<TournamentStatus, string> = {
  DRAFT: 'bg-gray-500',
  PENDING: 'bg-blue-500',
  IN_PROGRESS: 'bg-green-500',
  COMPLETED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
};

const STATUS_LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Sắp diễn ra',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

const GAME_TYPE_LABELS: Record<TournamentGameType, string> = {
  SINGLE_STAGE: 'Một vòng',
  TWO_STAGES: 'Hai vòng',
};

export function TournamentDetailClient({ tournamentId }: TournamentDetailClientProps) {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const fetchTournament = async () => {
    setLoading(true);
    try {
      const data = await tournamentsApi.getTournamentById(tournamentId);
      setTournament(data);
    } catch (error) {
      console.error('Lỗi khi tải giải đấu:', error);
      alert('Không thể tải thông tin giải đấu');
      router.push('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tournament) return;

    try {
      await tournamentsApi.deleteTournament(tournament.id);
      router.push('/tournaments');
    } catch (error) {
      console.error('Lỗi khi xóa giải đấu:', error);
      alert(error instanceof ApiError ? error.message : 'Không thể xóa giải đấu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  const isTwoStages = tournament.gameType === 'TWO_STAGES';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/tournaments')}
          className="w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{tournament.name}</h1>
            <p className="text-muted-foreground mt-1">
              {tournament.description || 'Chưa có mô tả'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className={STATUS_COLORS[tournament.status]}>
                {STATUS_LABELS[tournament.status]}
              </Badge>
              <Badge variant="outline">
                {GAME_TYPE_LABELS[tournament.gameType]}
              </Badge>
              {tournament.isTentative && (
                <Badge variant="secondary">Tạm thời</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Người tham gia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournament.participantsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tournament.participantsLocked ? 'Đã khóa' : 'Chưa khóa'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Trận đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournament.matchesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Tổng số trận</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Đăng ký
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tournament.registrationStartTime ? (
              <>
                <div className="text-lg font-bold">
                  {format(new Date(tournament.registrationStartTime), 'dd/MM/yyyy')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(tournament.registrationStartTime), 'HH:mm')}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Chưa xác định</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tạo lúc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {format(new Date(tournament.createdAt), 'dd/MM/yyyy')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(tournament.createdAt), 'HH:mm')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section - Moved out of tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình giải đấu</CardTitle>
          <CardDescription>Chi tiết về định dạng và quy tắc giải đấu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single Stage Config */}
          {tournament.singleStageConfig && (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium">Loại giải đấu</div>
                <div className="text-sm text-muted-foreground">
                  Một vòng - {tournament.singleStageConfig.format === 'SINGLE_ELIMINATION' ? 'Loại trực tiếp' : 'Vòng tròn'}
                </div>
              </div>

              {tournament.singleStageConfig.format === 'SINGLE_ELIMINATION' && tournament.singleStageConfig.singleEliminationConfig && (
                <div>
                  <div className="text-sm font-medium">Trận tranh hạng 3</div>
                  <div className="text-sm text-muted-foreground">
                    {tournament.singleStageConfig.singleEliminationConfig.hasPlacementMatches
                      ? 'Có - Thi đấu tranh hạng 3-4'
                      : 'Không - Đồng hạng 3'}
                  </div>
                </div>
              )}

              {tournament.singleStageConfig.format === 'ROUND_ROBIN' && tournament.singleStageConfig.roundRobinConfig && (
                <>
                  <div>
                    <div className="text-sm font-medium">Số trận mỗi cặp</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.singleStageConfig.roundRobinConfig.matchupsPerPair} trận
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Xếp hạng theo</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.singleStageConfig.roundRobinConfig.rankBy === 'MATCH_WINS' ? 'Số trận thắng' : 'Điểm số'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Quy tắc phá thế hòa</div>
                    <div className="text-sm text-muted-foreground">
                      {tournament.singleStageConfig.roundRobinConfig.tieBreaks.join(', ')}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Two Stages Config */}
          {tournament.twoStagesConfig && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Loại giải đấu</div>
                <div className="text-sm text-muted-foreground">Hai vòng - Vòng bảng + Vòng chung kết</div>
              </div>

              <Separator />

              <div>
                <div className="font-medium mb-3">Vòng bảng</div>
                <div className="space-y-2 ml-4">
                  <div>
                    <span className="text-sm font-medium">Số người mỗi bảng: </span>
                    <span className="text-sm text-muted-foreground">
                      {tournament.twoStagesConfig.groupStage.participantsPerGroup} người
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Số người lên vòng sau: </span>
                    <span className="text-sm text-muted-foreground">
                      {tournament.twoStagesConfig.groupStage.participantsAdvancing} người
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Số trận mỗi cặp: </span>
                    <span className="text-sm text-muted-foreground">
                      {tournament.twoStagesConfig.groupStage.matchupsPerPair} trận
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="font-medium mb-3">Vòng chung kết</div>
                <div className="space-y-2 ml-4">
                  <div>
                    <span className="text-sm font-medium">Định dạng: </span>
                    <span className="text-sm text-muted-foreground">Loại trực tiếp</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Trận tranh hạng 3: </span>
                    <span className="text-sm text-muted-foreground">
                      {tournament.twoStagesConfig.finalStage.hasPlacementMatches
                        ? 'Có - Thi đấu tranh hạng 3-4'
                        : 'Không - Đồng hạng 3'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs - Participants, Matches, Settings */}
      <Tabs defaultValue="participants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="participants">Người tham gia</TabsTrigger>
          {isTwoStages && <TabsTrigger value="groups">Bảng đấu</TabsTrigger>}
          <TabsTrigger value="matches">Trận đấu</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <ParticipantsTab
            tournamentId={tournamentId}
            participantsLocked={tournament.participantsLocked}
            onParticipantsChange={fetchTournament}
          />
        </TabsContent>

        {isTwoStages && (
          <TabsContent value="groups">
            <GroupsTab
              tournamentId={tournamentId}
              participantsLocked={tournament.participantsLocked}
              participantsPerGroupDefault={tournament.twoStagesConfig?.groupStage.participantsPerGroup}
              participantsAdvancingDefault={tournament.twoStagesConfig?.groupStage.participantsAdvancing}
            />
          </TabsContent>
        )}

        {/* Matches Tab */}
        <TabsContent value="matches">
          <MatchesPanel
            tournamentId={tournamentId}
            gameType={tournament.gameType}
            includeThirdPlaceMatch={
              tournament.gameType === 'SINGLE_STAGE'
                ? tournament.singleStageConfig?.singleEliminationConfig?.hasPlacementMatches
                : tournament.twoStagesConfig?.finalStage?.hasPlacementMatches
            }
            groupMatchupsPerPair={tournament.twoStagesConfig?.groupStage?.matchupsPerPair}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt</CardTitle>
              <CardDescription>Quản lý trạng thái và cấu hình giải đấu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Chức năng đang phát triển
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <TournamentFormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        tournament={tournament}
        onSuccess={() => {
          setShowEditDialog(false);
          fetchTournament();
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giải đấu?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giải đấu "{tournament.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
