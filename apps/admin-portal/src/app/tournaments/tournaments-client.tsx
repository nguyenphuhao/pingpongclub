'use client';

/**
 * Tournaments List Client Component
 * Mobile-first, modern UI with filters and actions (Vietnamese)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Trophy,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  CalendarDays,
  Filter,
  Search,
} from 'lucide-react';
import { Tournament, TournamentStatus, TournamentGameType } from '@/types/tournament';
import { tournamentsApi, ApiError } from '@/lib/api-client';
import { TournamentFormDialog } from './tournament-form-dialog';
import { format } from 'date-fns';

interface TournamentsClientProps {
  initialTournaments: Tournament[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

export function TournamentsClient({
  initialTournaments,
  initialPagination
}: TournamentsClientProps) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);

  // Fetch tournaments on initial mount
  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const result = await tournamentsApi.listTournaments({
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        gameType: gameTypeFilter !== 'all' ? gameTypeFilter : undefined,
      });

      setTournaments(result.data);
      setPagination(result.meta);
    } catch (error) {
      console.error('Lỗi khi tải danh sách giải đấu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTournament) return;

    try {
      await tournamentsApi.deleteTournament(deletingTournament.id);
      setDeletingTournament(null);
      fetchTournaments();
    } catch (error) {
      console.error('Lỗi khi xóa giải đấu:', error);
      alert(error instanceof ApiError ? error.message : 'Không thể xóa giải đấu');
    }
  };

  const handleFilterChange = () => {
    fetchTournaments();
  };

  // Filter tournaments by search query
  const filteredTournaments = tournaments.filter((tournament) =>
    searchQuery === '' ||
    tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tournament.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Giải đấu</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Quản lý các giải đấu và lịch thi đấu
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Tạo giải đấu
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm giải đấu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:hidden"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </Button>

            {/* Filters (Desktop always visible, Mobile toggleable) */}
            <div className={`grid gap-4 md:grid-cols-3 ${showFilters ? 'grid' : 'hidden md:grid'}`}>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setTimeout(handleFilterChange, 0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="DRAFT">Nháp</SelectItem>
                  <SelectItem value="PENDING">Sắp diễn ra</SelectItem>
                  <SelectItem value="IN_PROGRESS">Đang diễn ra</SelectItem>
                  <SelectItem value="COMPLETED">Đã kết thúc</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Select value={gameTypeFilter} onValueChange={(value) => {
                setGameTypeFilter(value);
                setTimeout(handleFilterChange, 0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Lọc theo loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="SINGLE_STAGE">Một vòng</SelectItem>
                  <SelectItem value="TWO_STAGES">Hai vòng</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleFilterChange} disabled={loading}>
                {loading ? 'Đang tải...' : 'Áp dụng'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang diễn ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournaments.filter((t) => t.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sắp diễn ra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournaments.filter((t) => t.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã kết thúc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournaments.filter((t) => t.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament Cards */}
      {filteredTournaments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Chưa có giải đấu nào</p>
            <p className="text-sm text-muted-foreground">Tạo giải đấu đầu tiên để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{tournament.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {tournament.description || 'Chưa có mô tả'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="-mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingTournament(tournament)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingTournament(tournament)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Status and Type */}
                  <div className="flex flex-wrap gap-2">
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

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{tournament.participantsCount || 0} người</span>
                    </div>
                    {tournament.registrationStartTime && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {format(new Date(tournament.registrationStartTime), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/tournaments/${tournament.id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} đến{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
            {pagination.total} giải đấu
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination({ ...pagination, page: pagination.page - 1 });
                setTimeout(fetchTournaments, 0);
              }}
              disabled={pagination.page === 1 || loading}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination({ ...pagination, page: pagination.page + 1 });
                setTimeout(fetchTournaments, 0);
              }}
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <TournamentFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchTournaments();
        }}
      />

      {/* Edit Dialog */}
      {editingTournament && (
        <TournamentFormDialog
          open={!!editingTournament}
          onOpenChange={(open) => !open && setEditingTournament(null)}
          tournament={editingTournament}
          onSuccess={() => {
            setEditingTournament(null);
            fetchTournaments();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingTournament}
        onOpenChange={(open) => !open && setDeletingTournament(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giải đấu?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giải đấu "{deletingTournament?.name}"? Hành động này không thể hoàn tác.
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
