'use client';

/**
 * Members List Client Component
 * 
 * Displays paginated list of members with search, filters, and actions
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Search, Users, UserCheck, UserPlus, Plus } from 'lucide-react';

interface Member {
  id: string;
  nickname: string | null;
  displayName: string | null;
  email: string;
  ratingPoints: number;
  totalMatches: number;
  winRate: number | null;
  status: string;
  tags: string[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  averageRating: number;
}

interface MembersClientProps {
  initialMembers: Member[];
  initialPagination?: Pagination;
  initialStats?: Stats;
  searchParams: any;
}

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

export function MembersClient({
  initialMembers,
  initialPagination,
  initialStats,
  searchParams,
}: MembersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.search || '');

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/members?${params.toString()}`);
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/members?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    startTransition(() => {
      router.push(`/members?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Thành viên</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách thành viên câu lạc bộ
          </p>
        </div>
        <Button asChild>
          <Link href="/members/new">
            <Plus className="h-4 w-4 mr-2" />
            Thêm thành viên
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thành viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialStats?.totalMembers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialStats?.activeMembers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thành viên mới (tháng này)</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{initialStats?.newMembersThisMonth || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(initialStats?.averageRating || 1000)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm & Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Tìm theo tên, nickname, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isPending}>
                <Search className="h-4 w-4 mr-2" />
                Tìm
              </Button>
            </div>

            <Select
              value={searchParams.rank || 'all'}
              onValueChange={(value) => handleFilterChange('rank', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Hạng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hạng</SelectItem>
                <SelectItem value="A_STAR">Hạng A*</SelectItem>
                <SelectItem value="A">Hạng A</SelectItem>
                <SelectItem value="B">Hạng B</SelectItem>
                <SelectItem value="C">Hạng C</SelectItem>
                <SelectItem value="D">Hạng D</SelectItem>
                <SelectItem value="E">Hạng E</SelectItem>
                <SelectItem value="F">Hạng F</SelectItem>
                <SelectItem value="G">Hạng G</SelectItem>
                <SelectItem value="H">Hạng H</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={searchParams.status || 'ACTIVE'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                <SelectItem value="SUSPENDED">Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thành viên</CardTitle>
          <CardDescription>
            Hiển thị {initialMembers.length} / {initialPagination?.total || 0} thành viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Hạng</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="text-right">Trận đấu</TableHead>
                <TableHead className="text-right">Tỷ lệ thắng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy thành viên nào
                  </TableCell>
                </TableRow>
              ) : (
                initialMembers.map((member) => {
                const rank = calculateRank(member.ratingPoints);
                const rankLabel = RANK_LABELS[rank];
                const rankColor = RANK_COLORS[rank];

                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">
                          {member.displayName || member.nickname || 'N/A'}
                        </div>
                        {member.nickname && member.displayName && (
                          <div className="text-sm text-muted-foreground">
                            @{member.nickname}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={rankColor}>{rankLabel}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {member.ratingPoints}
                    </TableCell>
                    <TableCell className="text-right">{member.totalMatches}</TableCell>
                    <TableCell className="text-right">
                      {member.winRate ? `${member.winRate.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.status === 'ACTIVE'
                            ? 'default'
                            : member.status === 'INACTIVE'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {member.status === 'ACTIVE' ? 'Hoạt động' : member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/members/${member.id}`}>Chi tiết</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Trang {initialPagination?.page || 1} / {initialPagination?.totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(initialPagination?.page || 1) <= 1 || isPending}
                onClick={() => handlePageChange((initialPagination?.page || 1) - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(initialPagination?.page || 1) >= (initialPagination?.totalPages || 1) || isPending}
                onClick={() => handlePageChange((initialPagination?.page || 1) + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

