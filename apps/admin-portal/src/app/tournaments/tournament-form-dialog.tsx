'use client';

/**
 * Tournament Form Dialog (Vietnamese)
 * Create/Edit tournament with smart, progressive form flow
 */

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MatchFormat, Tournament, TournamentFormData, TournamentGameType } from '@/types/tournament';
import { tournamentsApi, ApiError } from '@/lib/api-client';

interface TournamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament?: Tournament | null;
  onSuccess: () => void;
}

export function TournamentFormDialog({
  open,
  onOpenChange,
  tournament,
  onSuccess,
}: TournamentFormDialogProps) {
  const isEditing = !!tournament;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gameType, setGameType] = useState<TournamentGameType>('SINGLE_STAGE');
  const [registrationStartTime, setRegistrationStartTime] = useState('');
  const [isTentative, setIsTentative] = useState(false);

  // Single Stage config
  const [singleFormat, setSingleFormat] = useState<'SINGLE_ELIMINATION' | 'ROUND_ROBIN'>('SINGLE_ELIMINATION');
  const [hasPlacementMatches, setHasPlacementMatches] = useState(true);
  const [matchupsPerPair, setMatchupsPerPair] = useState(1);
  const [singleMatchFormat, setSingleMatchFormat] = useState<MatchFormat>({
    bestOf: 3,
    pointsToWin: 11,
    deuceRule: true,
    minLeadToWin: 2,
  });

  // Two Stages config
  const [participantsPerGroup, setParticipantsPerGroup] = useState(4);
  const [participantsAdvancing, setParticipantsAdvancing] = useState(2);
  const [groupMatchupsPerPair, setGroupMatchupsPerPair] = useState(1);
  const [finalHasPlacementMatches, setFinalHasPlacementMatches] = useState(true);
  const [groupMatchFormat, setGroupMatchFormat] = useState<MatchFormat>({
    bestOf: 3,
    pointsToWin: 11,
    deuceRule: true,
    minLeadToWin: 2,
  });
  const [finalMatchFormat, setFinalMatchFormat] = useState<MatchFormat>({
    bestOf: 3,
    pointsToWin: 11,
    deuceRule: true,
    minLeadToWin: 2,
  });

  // Load tournament data when editing
  useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setDescription(tournament.description || '');
      setGameType(tournament.gameType);
      setRegistrationStartTime(
        tournament.registrationStartTime
          ? new Date(tournament.registrationStartTime).toISOString().slice(0, 16)
          : ''
      );
      setIsTentative(tournament.isTentative);

      if (tournament.singleStageConfig) {
        const config = tournament.singleStageConfig;
        setSingleFormat(config.format);
        if (config.matchFormat) {
          setSingleMatchFormat({
            ...config.matchFormat,
            pointsToWin: 11,
            deuceRule: true,
            minLeadToWin: 2,
          });
        }
        if (config.singleEliminationConfig) {
          setHasPlacementMatches(config.singleEliminationConfig.hasPlacementMatches);
        }
        if (config.roundRobinConfig) {
          setMatchupsPerPair(config.roundRobinConfig.matchupsPerPair);
        }
      }

      if (tournament.twoStagesConfig) {
        const config = tournament.twoStagesConfig;
        setParticipantsPerGroup(config.groupStage.participantsPerGroup);
        setParticipantsAdvancing(config.groupStage.participantsAdvancing);
        setGroupMatchupsPerPair(config.groupStage.matchupsPerPair);
        setFinalHasPlacementMatches(config.finalStage.hasPlacementMatches);
        if (config.groupStage.matchFormat) {
          setGroupMatchFormat({
            ...config.groupStage.matchFormat,
            pointsToWin: 11,
            deuceRule: true,
            minLeadToWin: 2,
          });
        }
        if (config.finalStage.matchFormat) {
          setFinalMatchFormat({
            ...config.finalStage.matchFormat,
            pointsToWin: 11,
            deuceRule: true,
            minLeadToWin: 2,
          });
        }
      }
    } else {
      // Reset form
      setName('');
      setDescription('');
      setGameType('SINGLE_STAGE');
      setRegistrationStartTime('');
      setIsTentative(true);
      setSingleFormat('SINGLE_ELIMINATION');
      setHasPlacementMatches(true);
      setMatchupsPerPair(1);
      setSingleMatchFormat({
        bestOf: 3,
        pointsToWin: 11,
        deuceRule: true,
        minLeadToWin: 2,
      });
      setParticipantsPerGroup(4);
      setParticipantsAdvancing(2);
      setGroupMatchupsPerPair(1);
      setFinalHasPlacementMatches(true);
      setGroupMatchFormat({
        bestOf: 3,
        pointsToWin: 11,
        deuceRule: true,
        minLeadToWin: 2,
      });
      setFinalMatchFormat({
        bestOf: 3,
        pointsToWin: 11,
        deuceRule: true,
        minLeadToWin: 2,
      });
    }
    setError(null);
  }, [tournament, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: TournamentFormData = {
        name,
        description: description || undefined,
        game: 'TABLE_TENNIS',
        gameType,
        registrationStartTime: registrationStartTime || undefined,
        isTentative,
      };

      if (gameType === 'SINGLE_STAGE') {
        data.singleStageConfig = {
          format: singleFormat,
          matchFormat: singleMatchFormat,
        };

        if (singleFormat === 'SINGLE_ELIMINATION') {
          data.singleStageConfig.singleEliminationConfig = {
            hasPlacementMatches,
          };
        } else {
          data.singleStageConfig.roundRobinConfig = {
            matchupsPerPair,
            rankBy: 'MATCH_WINS',
            placementMethod: 'PARTICIPANT_LIST_ORDER',
            tieBreaks: ['WINS_VS_TIED', 'GAME_SET_DIFFERENCE', 'POINTS_DIFFERENCE'],
          };
        }
      } else {
        data.twoStagesConfig = {
          groupStage: {
            format: 'ROUND_ROBIN',
            matchFormat: groupMatchFormat,
            participantsPerGroup,
            participantsAdvancing,
            matchupsPerPair: groupMatchupsPerPair,
            rankBy: 'MATCH_WINS',
            placementMethod: 'PARTICIPANT_LIST_ORDER',
            tieBreaks: ['WINS_VS_TIED', 'GAME_SET_DIFFERENCE', 'POINTS_DIFFERENCE'],
          },
          finalStage: {
            format: 'SINGLE_ELIMINATION',
            matchFormat: finalMatchFormat,
            hasPlacementMatches: finalHasPlacementMatches,
          },
        };
      }

      if (isEditing) {
        await tournamentsApi.updateTournament(tournament.id, data);
      } else {
        await tournamentsApi.createTournament(data);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể lưu giải đấu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật thông tin và cấu hình giải đấu'
              : 'Thiết lập giải đấu mới với định dạng phù hợp'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium">Thông tin cơ bản</h3>

            <div>
              <Label htmlFor="name">Tên giải đấu *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Giải vô địch 2026"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về giải đấu..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="registrationStartTime">Thời gian mở đăng ký</Label>
                <Input
                  id="registrationStartTime"
                  type="datetime-local"
                  value={registrationStartTime}
                  onChange={(e) => setRegistrationStartTime(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={isTentative}
                    onCheckedChange={(checked) => setIsTentative(checked as boolean)}
                  />
                  <span className="text-sm font-medium">Đánh dấu tạm thời</span>
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tournament Type */}
          <div className="space-y-4">
            <div>
              <Label>Loại giải đấu *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Chọn cấu trúc giải đấu
              </p>
            </div>

            <RadioGroup value={gameType} onValueChange={(value) => setGameType(value as TournamentGameType)}>
              <Card className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="SINGLE_STAGE" id="single" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Một vòng</div>
                    <div className="text-sm text-muted-foreground">
                      Một bảng đấu duy nhất (Loại trực tiếp hoặc Vòng tròn)
                    </div>
                  </div>
                </label>
              </Card>

              <Card className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <RadioGroupItem value="TWO_STAGES" id="two" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Hai vòng</div>
                    <div className="text-sm text-muted-foreground">
                      Vòng bảng (Vòng tròn) + Vòng chung kết (Loại trực tiếp)
                    </div>
                  </div>
                </label>
              </Card>
            </RadioGroup>
          </div>

          <Separator />

          {/* Single Stage Config */}
          {gameType === 'SINGLE_STAGE' && (
            <div className="space-y-4">
              <h3 className="font-medium">Cấu hình một vòng</h3>

              <div>
                <Label htmlFor="singleFormat">Định dạng *</Label>
                <Select value={singleFormat} onValueChange={(value: any) => setSingleFormat(value)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_ELIMINATION">Loại trực tiếp</SelectItem>
                    <SelectItem value="ROUND_ROBIN">Vòng tròn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <Label>Định dạng trận đấu</Label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="singleBestOf" className="text-xs text-muted-foreground">
                      Best of
                    </Label>
                    <Select
                      value={singleMatchFormat.bestOf.toString()}
                      onValueChange={(value) =>
                        setSingleMatchFormat((prev) => ({
                          ...prev,
                          bestOf: Number(value) as MatchFormat['bestOf'],
                        }))
                      }
                    >
                      <SelectTrigger id="singleBestOf" className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Best of 3</SelectItem>
                        <SelectItem value="5">Best of 5</SelectItem>
                        <SelectItem value="7">Best of 7</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="singlePointsToWin" className="text-xs text-muted-foreground">
                      Điểm thắng
                    </Label>
                    <Input
                      id="singlePointsToWin"
                      value="11 điểm"
                      disabled
                      className="mt-1.5"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground sm:pt-8">Deuce 2 điểm (mặc định)</div>
                </div>
              </div>

              {singleFormat === 'SINGLE_ELIMINATION' && (
                <div className="rounded-lg border p-4 space-y-3">
                  <Label>Trận tranh hạng 3</Label>
                  <RadioGroup
                    value={hasPlacementMatches ? 'yes' : 'no'}
                    onValueChange={(value) => setHasPlacementMatches(value === 'yes')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="placement-yes" />
                      <Label htmlFor="placement-yes" className="font-normal">
                        Có - Thi đấu tranh hạng 3-4
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="placement-no" />
                      <Label htmlFor="placement-no" className="font-normal">
                        Không - Đồng hạng 3
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {singleFormat === 'ROUND_ROBIN' && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div>
                    <Label htmlFor="matchups">Số trận mỗi cặp</Label>
                    <Input
                      id="matchups"
                      type="number"
                      min={1}
                      max={3}
                      value={matchupsPerPair}
                      onChange={(e) => setMatchupsPerPair(parseInt(e.target.value))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mỗi cặp đấu thi đấu bao nhiêu lần (thường là 1)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Two Stages Config */}
          {gameType === 'TWO_STAGES' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Vòng bảng (Vòng tròn)</h3>

                <div className="rounded-lg border p-4 space-y-3">
                  <Label>Định dạng trận đấu</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="groupBestOf" className="text-xs text-muted-foreground">
                        Best of
                      </Label>
                      <Select
                        value={groupMatchFormat.bestOf.toString()}
                        onValueChange={(value) =>
                          setGroupMatchFormat((prev) => ({
                            ...prev,
                            bestOf: Number(value) as MatchFormat['bestOf'],
                          }))
                        }
                      >
                        <SelectTrigger id="groupBestOf" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Best of 3</SelectItem>
                          <SelectItem value="5">Best of 5</SelectItem>
                          <SelectItem value="7">Best of 7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="groupPointsToWin" className="text-xs text-muted-foreground">
                        Điểm thắng
                      </Label>
                      <Input
                        id="groupPointsToWin"
                        value="11 điểm"
                        disabled
                        className="mt-1.5"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground sm:pt-8">Deuce 2 điểm (mặc định)</div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="participantsPerGroup">Số người mỗi bảng *</Label>
                    <Input
                      id="participantsPerGroup"
                      type="number"
                      min={2}
                      max={20}
                      value={participantsPerGroup}
                      onChange={(e) => setParticipantsPerGroup(parseInt(e.target.value))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      2-20 người (mặc định: 4)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="participantsAdvancing">Số người lên vòng sau *</Label>
                    <Input
                      id="participantsAdvancing"
                      type="number"
                      min={1}
                      max={participantsPerGroup - 1}
                      value={participantsAdvancing}
                      onChange={(e) => setParticipantsAdvancing(parseInt(e.target.value))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Top N lên vòng chung kết (mặc định: 2)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="groupMatchups">Số trận mỗi cặp</Label>
                  <Input
                    id="groupMatchups"
                    type="number"
                    min={1}
                    max={3}
                    value={groupMatchupsPerPair}
                    onChange={(e) => setGroupMatchupsPerPair(parseInt(e.target.value))}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Vòng chung kết (Loại trực tiếp)</h3>

                <div className="rounded-lg border p-4 space-y-3">
                  <Label>Định dạng trận đấu</Label>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="finalBestOf" className="text-xs text-muted-foreground">
                        Best of
                      </Label>
                      <Select
                        value={finalMatchFormat.bestOf.toString()}
                        onValueChange={(value) =>
                          setFinalMatchFormat((prev) => ({
                            ...prev,
                            bestOf: Number(value) as MatchFormat['bestOf'],
                          }))
                        }
                      >
                        <SelectTrigger id="finalBestOf" className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Best of 3</SelectItem>
                          <SelectItem value="5">Best of 5</SelectItem>
                          <SelectItem value="7">Best of 7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="finalPointsToWin" className="text-xs text-muted-foreground">
                        Điểm thắng
                      </Label>
                      <Input
                        id="finalPointsToWin"
                        value="11 điểm"
                        disabled
                        className="mt-1.5"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground sm:pt-8">Deuce 2 điểm (mặc định)</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <Label>Trận tranh hạng 3</Label>
                  <RadioGroup
                    value={finalHasPlacementMatches ? 'yes' : 'no'}
                    onValueChange={(value) => setFinalHasPlacementMatches(value === 'yes')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="final-placement-yes" />
                      <Label htmlFor="final-placement-yes" className="font-normal">
                        Có - Thi đấu tranh hạng 3-4
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="final-placement-no" />
                      <Label htmlFor="final-placement-no" className="font-normal">
                        Không - Đồng hạng 3
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
