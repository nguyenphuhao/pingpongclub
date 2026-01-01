'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateMember } from '../../actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { AdjustRatingDialog } from './adjust-rating-dialog';

const formSchema = z.object({
  displayName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  nickname: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  dateOfBirth: z.string().optional(),
  startedPlayingAt: z.string().optional(),
  playStyle: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  bio: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  adminNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Member {
  id: string;
  displayName: string | null;
  nickname: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  startedPlayingAt: string | null;
  playStyle: string | null;
  tags: string[];
  bio: string | null;
  status: string;
  adminNotes: string | null;
  ratingPoints: number;
  peakRating: number;
}

interface EditMemberFormProps {
  member: Member;
}

export function EditMemberForm({ member }: EditMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: member.displayName || '',
      nickname: member.nickname || '',
      email: member.email,
      phone: member.phone || '',
      gender: (member.gender as any) || undefined,
      dateOfBirth: member.dateOfBirth ? format(new Date(member.dateOfBirth), 'yyyy-MM-dd') : '',
      startedPlayingAt: member.startedPlayingAt
        ? format(new Date(member.startedPlayingAt), 'yyyy-MM-dd')
        : '',
      playStyle: member.playStyle || '',
      tags: member.tags.join(', '),
      bio: member.bio || '',
      status: member.status as any,
      adminNotes: member.adminNotes || '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert tags from comma-separated string to array
      const tagsArray = values.tags
        ? values.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      await updateMember(member.id, {
        displayName: values.displayName,
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : null,
        startedPlayingAt: values.startedPlayingAt
          ? new Date(values.startedPlayingAt).toISOString()
          : null,
        playStyle: values.playStyle,
        tags: tagsArray,
        bio: values.bio,
        status: values.status,
        adminNotes: values.adminNotes,
      });

      setSuccess(true);

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/members/${member.id}`);
        router.refresh();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi cập nhật thành viên');
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Cập nhật thành công! Đang chuyển hướng...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rating Adjustment Card - Separate from main form */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Điều chỉnh Rating
          </CardTitle>
          <CardDescription>
            Thay đổi điểm rating sẽ tự động cập nhật hạng của thành viên
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rating hiện tại</label>
              <div className="text-2xl font-bold mt-1">{member.ratingPoints}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Rating cao nhất</label>
              <div className="text-2xl font-bold mt-1">{member.peakRating}</div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowRatingDialog(true)}
          >
            Điều chỉnh Rating
          </Button>
        </CardContent>
      </Card>

      {/* Main Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <CardDescription>
            Chỉnh sửa thông tin cá nhân và liên hệ của thành viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Display Name & Nickname */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tên hiển thị <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="vana" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="+84 xxx xxx xxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gender & Date of Birth */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giới tính</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Nam</SelectItem>
                          <SelectItem value="FEMALE">Nữ</SelectItem>
                          <SelectItem value="OTHER">Khác</SelectItem>
                          <SelectItem value="PREFER_NOT_TO_SAY">Không tiết lộ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày sinh</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Started Playing & Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startedPlayingAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bắt đầu chơi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>Dùng để tính số năm kinh nghiệm</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                          <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                          <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Thành viên Inactive sẽ không hiển thị trong danh sách mặc định
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Play Style */}
              <FormField
                control={form.control}
                name="playStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lối chơi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn lối chơi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Defensive">Phòng thủ</SelectItem>
                        <SelectItem value="Offensive">Tấn công</SelectItem>
                        <SelectItem value="All-round">Toàn diện</SelectItem>
                        <SelectItem value="Tactical">Chiến thuật</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="singles, doubles, left-handed" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nhập các tag cách nhau bởi dấu phẩy (VD: singles, doubles, left-handed)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giới thiệu</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Giới thiệu ngắn về thành viên..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Admin Notes */}
              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ghi chú Admin</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ghi chú nội bộ, chỉ admin xem được..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Chỉ admin có thể xem và chỉnh sửa</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Adjust Rating Dialog */}
      <AdjustRatingDialog
        memberId={member.id}
        memberName={member.displayName || member.nickname || member.email}
        currentRating={member.ratingPoints}
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
      />
    </div>
  );
}

