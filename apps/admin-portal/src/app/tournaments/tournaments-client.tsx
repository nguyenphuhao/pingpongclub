'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Trash2, Trophy, Plus } from 'lucide-react';
import type { PaginationMeta, Tournament } from './actions';
import { createTournament, deleteTournament } from './actions';

interface TournamentsClientProps {
  initialTournaments: Tournament[];
  initialPagination: PaginationMeta;
  searchParams: {
    search?: string;
    page?: string;
    orderBy?: 'createdAt' | 'name';
    order?: 'asc' | 'desc';
  };
}

export function TournamentsClient({
  initialTournaments,
  initialPagination,
  searchParams,
}: TournamentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.search || '');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createMatchFormat, setCreateMatchFormat] = useState<'SINGLE' | 'DOUBLES'>('SINGLE');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/tournaments?${params.toString()}`);
    });
  };

  const handleSortChange = (key: 'orderBy' | 'order', value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/tournaments?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`/tournaments?${params.toString()}`);
    });
  };

  const handleCreate = async () => {
    setCreateError(null);

    if (createName.trim().length < 2) {
      setCreateError('Tên giải đấu phải có ít nhất 2 ký tự.');
      return;
    }

    setIsCreating(true);

    try {
      await createTournament({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        matchFormat: createMatchFormat,
      });
      setCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      setCreateMatchFormat('SINGLE');
      router.refresh();
    } catch (error: any) {
      setCreateError(error.message || 'Không thể tạo giải đấu.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);

    try {
      await deleteTournament(id);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Giải đấu</h1>
          <p className="text-muted-foreground">
            Tạo và theo dõi giải đấu cùng các stage liên quan
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="lg:mt-1">
          <Plus className="mr-2 h-4 w-4" />
          Tạo giải đấu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc nhanh</CardTitle>
          <CardDescription>Tìm giải đấu theo tên hoặc sắp xếp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Nhập tên giải đấu..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isPending}>
                <Search className="mr-2 h-4 w-4" />
                Tìm
              </Button>
            </div>

            <div className="flex gap-2">
              <Select
                value={searchParams.orderBy || 'createdAt'}
                onValueChange={(value) => handleSortChange('orderBy', value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="name">Tên giải đấu</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={searchParams.order || 'desc'}
                onValueChange={(value) => handleSortChange('order', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Thứ tự" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mới nhất</SelectItem>
                  <SelectItem value="asc">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách giải đấu</CardTitle>
          <CardDescription>
            Hiển thị {initialTournaments.length} / {initialPagination.total} giải đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên giải đấu</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialTournaments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Chưa có giải đấu nào
                    </TableCell>
                  </TableRow>
                ) : (
                  initialTournaments.map((tournament) => (
                    <TableRow key={tournament.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          {tournament.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tournament.description || 'Chưa có mô tả'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(tournament.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/tournaments/${tournament.id}`}>Chi tiết</Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa giải đấu?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Giải đấu sẽ bị xóa vĩnh viễn và không thể khôi phục.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(tournament.id)}
                                  disabled={deleteId === tournament.id}
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-4 lg:hidden">
            {initialTournaments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Chưa có giải đấu nào</div>
            ) : (
              initialTournaments.map((tournament) => (
                <Card key={tournament.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <CardDescription>
                      {tournament.description || 'Chưa có mô tả'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {format(new Date(tournament.createdAt), 'dd/MM/yyyy')}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/tournaments/${tournament.id}`}>Chi tiết</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa giải đấu?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Giải đấu sẽ bị xóa vĩnh viễn và không thể khôi phục.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(tournament.id)}
                              disabled={deleteId === tournament.id}
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
            <span>
              Trang {initialPagination.page} / {initialPagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={initialPagination.page <= 1 || isPending}
                onClick={() => handlePageChange(initialPagination.page - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={initialPagination.page >= initialPagination.totalPages || isPending}
                onClick={() => handlePageChange(initialPagination.page + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo giải đấu mới</DialogTitle>
            <DialogDescription>
              Thiết lập tên và mô tả nhanh để bắt đầu quản lý stage.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <Alert variant="destructive">
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên giải đấu</label>
              <Input
                placeholder="Giải đấu mùa xuân 2025"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                placeholder="Sân số 1, 2 - vòng bảng + loại trực tiếp"
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại giải đấu</label>
              <Select value={createMatchFormat} onValueChange={(value: 'SINGLE' | 'DOUBLES') => setCreateMatchFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại giải đấu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Đấu đơn (Singles)</SelectItem>
                  <SelectItem value="DOUBLES">Đấu đôi (Doubles)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? 'Đang tạo...' : 'Tạo giải đấu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
