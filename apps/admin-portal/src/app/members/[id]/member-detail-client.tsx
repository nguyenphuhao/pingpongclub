'use client';

/**
 * Member Detail Client Component
 * 
 * Displays detailed member information with editing capabilities
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Trophy, Target } from 'lucide-react';
import { format } from 'date-fns';

interface Member {
  id: string;
  email: string;
  phone: string | null;
  nickname: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  ratingPoints: number;
  peakRating: number;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number | null;
  currentStreak: number;
  yearsPlaying: number | null;
  startedPlayingAt: string | null;
  tags: string[];
  playStyle: string | null;
  bio: string | null;
  adminNotes: string | null;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  currentRank?: string;
  rankInfo?: {
    label: string;
    minPoints: number;
    maxPoints: number | null;
  };
  ratingHistory?: any[];
  recentMatches?: any[];
}

interface MemberDetailClientProps {
  member: Member;
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

export function MemberDetailClient({ member }: MemberDetailClientProps) {
  const router = useRouter();
  const rank = calculateRank(member.ratingPoints);
  const rankLabel = RANK_LABELS[rank];
  const rankColor = RANK_COLORS[rank];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/members">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {member.displayName || member.nickname || 'N/A'}
            </h1>
            {member.nickname && member.displayName && (
              <p className="text-muted-foreground">@{member.nickname}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/members/${member.id}/edit`}>Chỉnh sửa</Link>
          </Button>
          <Button variant="destructive" onClick={() => {
            if (confirm('Bạn có chắc muốn xóa thành viên này?')) {
              // Handle delete
            }
          }}>
            Xóa
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hạng hiện tại</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={`${rankColor} text-2xl py-1 px-3`}>{rankLabel}</Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {member.ratingPoints} điểm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thắng</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {member.winRate ? `${member.winRate.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {member.totalWins}W / {member.totalLosses}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng trận đấu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.totalMatches}</div>
            <p className="text-xs text-muted-foreground">
              Streak: {member.currentStreak > 0 ? `+${member.currentStreak}` : member.currentStreak}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating cao nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{member.peakRating}</div>
            <p className="text-xs text-muted-foreground">
              Chênh lệch: {member.peakRating - member.ratingPoints > 0 ? '-' : ''}
              {Math.abs(member.peakRating - member.ratingPoints)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
          <TabsTrigger value="history">Lịch sử Rating</TabsTrigger>
          <TabsTrigger value="matches">Trận đấu</TabsTrigger>
          <TabsTrigger value="admin">Ghi chú Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                </div>

                {member.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{member.phone}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Giới tính</label>
                  <div className="mt-1">{member.gender || 'Chưa cập nhật'}</div>
                </div>

                {member.dateOfBirth && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ngày sinh</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(member.dateOfBirth), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>
                )}

                {member.startedPlayingAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bắt đầu chơi</label>
                    <div className="mt-1">
                      {format(new Date(member.startedPlayingAt), 'dd/MM/yyyy')}
                      {member.yearsPlaying && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({member.yearsPlaying.toFixed(1)} năm)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {member.playStyle && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lối chơi</label>
                    <div className="mt-1">{member.playStyle}</div>
                  </div>
                )}
              </div>

              {member.tags && member.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {member.bio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Giới thiệu</label>
                  <p className="mt-1 text-sm">{member.bio}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Trạng thái</label>
                    <div className="mt-1">
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
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Ngày tham gia</label>
                    <div className="mt-1">{format(new Date(member.createdAt), 'dd/MM/yyyy')}</div>
                  </div>
                  {member.lastLoginAt && (
                    <div>
                      <label className="text-muted-foreground">Đăng nhập lần cuối</label>
                      <div className="mt-1">
                        {format(new Date(member.lastLoginAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Thống kê chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Thành tích</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{member.totalWins}</div>
                      <div className="text-sm text-muted-foreground">Thắng</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded">
                      <div className="text-2xl font-bold text-red-600">{member.totalLosses}</div>
                      <div className="text-sm text-muted-foreground">Thua</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {member.totalMatches - member.totalWins - member.totalLosses}
                      </div>
                      <div className="text-sm text-muted-foreground">Hòa</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Rating</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hiện tại:</span>
                      <span className="font-semibold">{member.ratingPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cao nhất:</span>
                      <span className="font-semibold">{member.peakRating}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hạng:</span>
                      <Badge className={rankColor}>{rankLabel}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thay đổi Rating</CardTitle>
              <CardDescription>Coming soon...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử trận đấu</CardTitle>
              <CardDescription>Coming soon...</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Ghi chú Admin</CardTitle>
              <CardDescription>Chỉ admin có thể xem và chỉnh sửa</CardDescription>
            </CardHeader>
            <CardContent>
              {member.adminNotes ? (
                <div className="p-4 bg-muted rounded">
                  <p className="text-sm whitespace-pre-wrap">{member.adminNotes}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có ghi chú</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

