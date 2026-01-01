'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { updateMember } from '../../actions';

interface AdjustRatingDialogProps {
  memberId: string;
  memberName: string;
  currentRating: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function calculateRank(rating: number): { rank: string; label: string; color: string } {
  if (rating > 2200) return { rank: 'A_STAR', label: 'A*', color: 'text-red-600' };
  if (rating >= 2001) return { rank: 'A', label: 'A', color: 'text-red-500' };
  if (rating >= 1801) return { rank: 'B', label: 'B', color: 'text-orange-500' };
  if (rating >= 1601) return { rank: 'C', label: 'C', color: 'text-yellow-600' };
  if (rating >= 1401) return { rank: 'D', label: 'D', color: 'text-green-500' };
  if (rating >= 1201) return { rank: 'E', label: 'E', color: 'text-blue-500' };
  if (rating >= 1001) return { rank: 'F', label: 'F', color: 'text-indigo-500' };
  if (rating >= 801) return { rank: 'G', label: 'G', color: 'text-purple-500' };
  return { rank: 'H', label: 'H', color: 'text-gray-500' };
}

export function AdjustRatingDialog({
  memberId,
  memberName,
  currentRating,
  open,
  onOpenChange,
}: AdjustRatingDialogProps) {
  const router = useRouter();
  const [newRating, setNewRating] = useState(currentRating.toString());
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const newRatingNum = parseInt(newRating) || currentRating;
  const difference = newRatingNum - currentRating;
  const currentRankInfo = calculateRank(currentRating);
  const newRankInfo = calculateRank(newRatingNum);
  const rankChanged = currentRankInfo.rank !== newRankInfo.rank;

  function handleNext() {
    if (newRatingNum === currentRating) {
      setError('Rating mới phải khác với rating hiện tại');
      return;
    }
    if (newRatingNum < 0 || newRatingNum > 3000) {
      setError('Rating phải nằm trong khoảng 0-3000');
      return;
    }
    setError(null);
    setShowConfirmation(true);
  }

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);

    try {
      await updateMember(memberId, {
        ratingPoints: newRatingNum,
        // Note: Backend should handle updating peakRating if newRating > current peakRating
      });

      onOpenChange(false);
      router.refresh();
      
      // Reset form
      setShowConfirmation(false);
      setReason('');
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi cập nhật rating');
      setIsLoading(false);
    }
  }

  function handleCancel() {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else {
      onOpenChange(false);
      setNewRating(currentRating.toString());
      setReason('');
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle>Điều chỉnh Rating</DialogTitle>
              <DialogDescription>
                Thay đổi điểm rating của {memberName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Current Rating */}
              <div className="space-y-2">
                <Label>Rating hiện tại</Label>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold">{currentRating}</div>
                  <div className={`text-lg font-semibold ${currentRankInfo.color}`}>
                    Hạng {currentRankInfo.label}
                  </div>
                </div>
              </div>

              {/* New Rating Input */}
              <div className="space-y-2">
                <Label htmlFor="newRating">Rating mới *</Label>
                <Input
                  id="newRating"
                  type="number"
                  placeholder="Nhập rating mới"
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  min="0"
                  max="3000"
                />
              </div>

              {/* Rating Change Preview */}
              {newRatingNum !== currentRating && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Thay đổi:</span>
                      <div className="flex items-center gap-1">
                        {difference > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={`font-bold ${
                            difference > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {difference > 0 ? '+' : ''}
                          {difference}
                        </span>
                      </div>
                    </div>
                  </div>

                  {rankChanged && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-semibold ${currentRankInfo.color}`}>
                        Hạng {currentRankInfo.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                      <span className={`font-semibold ${newRankInfo.color}`}>
                        Hạng {newRankInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Reason (optional) */}
              <div className="space-y-2">
                <Label htmlFor="reason">Lý do (không bắt buộc)</Label>
                <Input
                  id="reason"
                  placeholder="VD: Điều chỉnh sau giải đấu..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
              <Button onClick={handleNext}>Tiếp tục</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Xác nhận thay đổi Rating</DialogTitle>
              <DialogDescription>
                Vui lòng xác nhận thông tin trước khi cập nhật
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Bạn có chắc muốn thay đổi rating của {memberName}?</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rating hiện tại:</span>
                  <span className="font-bold">{currentRating}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rating mới:</span>
                  <span className="font-bold text-primary">{newRatingNum}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Thay đổi:</span>
                  <span
                    className={`font-bold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {difference > 0 ? '+' : ''}
                    {difference}
                  </span>
                </div>
                {rankChanged && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Hạng:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${currentRankInfo.color}`}>
                        {currentRankInfo.label}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                      <span className={`font-semibold ${newRankInfo.color}`}>
                        {newRankInfo.label}
                      </span>
                    </div>
                  </div>
                )}
                {reason && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Lý do:</span>
                    <p className="text-sm mt-1">{reason}</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Quay lại
              </Button>
              <Button onClick={handleConfirm} disabled={isLoading}>
                {isLoading ? 'Đang cập nhật...' : 'Xác nhận'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

